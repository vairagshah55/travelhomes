/**
 * Calendar-bookings service.
 *
 * Drives the vendor-side calendar UI. The list endpoint blends three
 * collections into one display-ready stream:
 *   - CalendarBooking  (the canonical row)
 *   - BookingDetail    (older denormalised rows, mapped to calendar shape)
 *   - Booking          (canonical Booking via Management services)
 *
 * Conflict detection on create + date-update prevents double-booking the
 * same resourceName.
 */
const mongoose = require("mongoose");

const CalendarBooking = require("../../models/CalendarBooking");
const BookingDetail = require("../../models/BookingDetail");
const Offer = require("../../models/Offer");
const Vendor = require("../../models/Vendor");
const Booking = require("../../models/Booking");
const Management = require("../../models/Management");
const User = require("../../models/User");
const logger = require("../../shared/logger");
const { NotFoundError, ConflictError } = require("../../shared/errors");

// ─── Helpers ────────────────────────────────────────────────────────────────

// Build the {start, end} half-open window for a (month, year) pair (1-indexed
// month). Returns null when either is missing/invalid.
function monthWindow(month, year) {
  if (!month || !year) return null;
  const m = Number(month) - 1;
  const y = Number(year);
  return { start: new Date(y, m, 1), end: new Date(y, m + 1, 1) };
}

function colorFor(status) {
  if (status === "Cancelled") return "#EF4444";
  if (status === "Checked-in") return "#10B981";
  if (status === "Checked-out") return "#6B7280";
  return "#3B82F6"; // Confirmed (default)
}

function totalDays(start, end) {
  if (!start || !end) return 1;
  return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) || 1;
}

function mapBookingDetailToRow(bd) {
  let status = "Confirmed";
  if (bd.status === "cancelled") status = "Cancelled";
  else if (bd.status === "active") status = "Checked-in";

  // servicePrice may be a number, "₹ 1500" string, or undefined.
  let price = 0;
  if (typeof bd.servicePrice === "number") {
    price = bd.servicePrice;
  } else if (bd.servicePrice) {
    const m = String(bd.servicePrice).match(/(\d+)/);
    if (m) price = parseInt(m[0], 10);
  }

  return {
    _id: bd._id,
    bookingId: bd.id || bd._id.toString(),
    guestName: bd.clientName,
    resourceName: bd.serviceName,
    startDate: bd.checkIn || new Date(),
    endDate: bd.checkOut || new Date(),
    status,
    adults: bd.guests || 1,
    children: 0,
    totalGuests: bd.guests || 1,
    basePrice: price,
    totalAmount: price,
    email: bd.contactEmail,
    phoneNumber: bd.contactPhone,
    createdAt: bd.createdAt,
    updatedAt: bd.updatedAt,
    totalDays: totalDays(bd.checkIn, bd.checkOut),
    color: colorFor(status),
    isFromBookingDetail: true,
  };
}

function mapBookingToRow(b) {
  const raw = String(b.bookingStatus || "").toLowerCase();
  let status = "Confirmed";
  if (raw === "cancelled") status = "Cancelled";
  else if (raw === "checked-in" || raw === "active") status = "Checked-in";
  else if (raw === "checked-out" || raw === "completed") status = "Checked-out";

  return {
    _id: b._id,
    bookingId: b.bookingId || b._id.toString(),
    guestName: b.clientName,
    resourceName: b.serviceId?.brandName || b.serviceName || "Service",
    startDate: b.checkInDate,
    endDate: b.checkOutDate,
    status,
    adults: b.numberOfGuests || 1,
    children: 0,
    totalGuests: b.numberOfGuests || 1,
    basePrice: b.baseAmount || 0,
    totalAmount: b.totalAmount || 0,
    email: b.clientEmail,
    phoneNumber: b.clientPhone,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    vendorId: b.serviceId?.vendorId,
    totalDays: totalDays(b.checkInDate, b.checkOutDate),
    color: colorFor(status),
    isFromBooking: true,
  };
}

// Resolve a vendor record from either of the legacy identifiers (custom
// `vendorId` string, ObjectId, or email). Returns null when none match.
async function resolveVendor({ vendorId, vendorEmail }) {
  if (vendorId) {
    let vendor = await Vendor.findOne({ vendorId });
    if (!vendor && mongoose.Types.ObjectId.isValid(vendorId)) {
      vendor = await Vendor.findById(vendorId);
    }
    if (vendor) return vendor;
  }
  if (vendorEmail) {
    return Vendor.findOne({ email: vendorEmail });
  }
  return null;
}

// ─── List ───────────────────────────────────────────────────────────────────
async function list({ month, year, page = 1, limit = 50, vendorId, vendorEmail }) {
  const skip = (Number(page) - 1) * Number(limit);
  const filter = {};
  let vendor = null;
  let vendorOfferNames = [];

  if (vendorId || vendorEmail) {
    vendor = await resolveVendor({ vendorId, vendorEmail });
    if (!vendor) {
      // Vendor criteria provided but vendor not found — return empty.
      filter._id = new mongoose.Types.ObjectId();
    } else {
      const offerOr = [];
      if (vendor.vendorId) offerOr.push({ vendorId: vendor.vendorId });
      if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
        offerOr.push({ userId: vendorId });
      }
      if (vendor.userId) offerOr.push({ userId: vendor.userId });

      if (offerOr.length > 0) {
        const offers = await Offer.find({ $or: offerOr }).select("name");
        vendorOfferNames = offers.map((o) => o.name);
      }

      const vendorIds = [vendor._id.toString()];
      if (vendor.vendorId) vendorIds.push(vendor.vendorId);

      const orClauses = [{ vendorId: { $in: vendorIds } }];
      if (vendorOfferNames.length > 0) {
        orClauses.push({ resourceName: { $in: vendorOfferNames } });
      }
      filter.$or = orClauses;
    }
  }

  // Date filter — span/overlap semantics: start < end-of-window AND
  // end >= start-of-window OR strictly enclosing.
  const win = monthWindow(month, year);
  if (win) {
    const dateOr = [
      { startDate: { $gte: win.start, $lt: win.end } },
      { endDate: { $gte: win.start, $lt: win.end } },
      { startDate: { $lt: win.start }, endDate: { $gte: win.end } },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: dateOr }];
      delete filter.$or;
    } else {
      filter.$or = dateOr;
    }
  }

  const calendarBookings = await CalendarBooking.find(filter).sort({ startDate: 1 });

  // Blend in BookingDetail and (Management-owned) Booking rows.
  let bookingDetails = [];
  let serviceBookings = [];

  if (vendor) {
    const vendorIds = [vendor._id.toString()];
    if (vendor.vendorId) vendorIds.push(vendor.vendorId);

    let bdFilter = {
      $or: [
        { vendorId: { $in: vendorIds } },
        { serviceName: { $in: vendorOfferNames }, vendorId: { $exists: false } },
        { serviceName: { $in: vendorOfferNames }, vendorId: null },
        { serviceName: { $in: vendorOfferNames }, vendorId: "" },
      ],
    };
    if (win) {
      bdFilter = {
        $and: [
          bdFilter,
          {
            $or: [
              { checkIn: { $gte: win.start, $lt: win.end } },
              { checkOut: { $gte: win.start, $lt: win.end } },
              { checkIn: { $lt: win.start }, checkOut: { $gte: win.end } },
            ],
          },
        ],
      };
    }
    bookingDetails = await BookingDetail.find(bdFilter);

    try {
      const vendorUser = await User.findOne({ email: vendor.email });
      if (vendorUser) {
        const mServices = await Management.find({ vendorId: vendorUser._id }).select(
          "_id brandName",
        );
        const mIds = mServices.map((s) => s._id);
        if (mIds.length > 0) {
          const bFilter = { serviceId: { $in: mIds } };
          if (win) {
            bFilter.$or = [
              { checkInDate: { $gte: win.start, $lt: win.end } },
              { checkOutDate: { $gte: win.start, $lt: win.end } },
              { checkInDate: { $lt: win.start }, checkOutDate: { $gte: win.end } },
            ];
          }
          serviceBookings = await Booking.find(bFilter).populate("serviceId");
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, "calendar-bookings: vendor service lookup failed");
    }
  } else if (!vendorId && !vendorEmail) {
    // Admin (no vendor filter) — pull Bookings within the date window.
    try {
      const bFilter = {};
      if (win) {
        bFilter.$or = [
          { checkInDate: { $gte: win.start, $lt: win.end } },
          { checkOutDate: { $gte: win.start, $lt: win.end } },
          { checkInDate: { $lt: win.start }, checkOutDate: { $gte: win.end } },
        ];
      }
      serviceBookings = await Booking.find(bFilter).populate("serviceId");
    } catch (err) {
      logger.warn({ err: err.message }, "calendar-bookings: admin booking lookup failed");
    }
  }

  const all = [
    ...calendarBookings,
    ...bookingDetails.map(mapBookingDetailToRow),
    ...serviceBookings.map(mapBookingToRow),
  ];
  all.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const totalCount = all.length;
  const data = all.slice(skip, skip + Number(limit));
  const resources = [...new Set(all.map((b) => b.resourceName))];

  return {
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit)),
      totalCount,
      hasNext: skip + Number(limit) < totalCount,
    },
    meta: { resources },
  };
}

// ─── Get by id ──────────────────────────────────────────────────────────────
async function getById(id) {
  const booking = await CalendarBooking.findById(id);
  if (!booking) throw new NotFoundError("Booking", id);
  return { data: booking };
}

// ─── Create (with conflict detection) ───────────────────────────────────────
async function create(input) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  const conflict = await CalendarBooking.findOne({
    resourceName: input.resourceName,
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });
  if (conflict) {
    throw new ConflictError(
      `Booking conflict: ${conflict.startDate.toISOString().slice(0, 10)} to ${conflict.endDate.toISOString().slice(0, 10)}`,
    );
  }

  const doc = new CalendarBooking({
    ...input,
    startDate,
    endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Auto-resolve vendorId from the matching Offer when missing.
  if (!doc.vendorId && input.resourceName) {
    try {
      const offer = await Offer.findOne({ name: input.resourceName });
      if (offer) doc.vendorId = offer.vendorId || offer.userId || "";
    } catch (err) {
      logger.warn({ err: err.message }, "calendar-bookings: vendorId auto-resolve failed");
    }
  }

  const saved = await doc.save();
  return { data: saved };
}

// ─── Update (with conflict detection on date changes) ───────────────────────
async function update(id, patch) {
  const updateData = { ...patch };

  if (updateData.startDate || updateData.endDate) {
    const booking = await CalendarBooking.findById(id);
    if (!booking) throw new NotFoundError("Booking", id);

    const startDate = new Date(updateData.startDate || booking.startDate);
    const endDate = new Date(updateData.endDate || booking.endDate);

    const conflict = await CalendarBooking.findOne({
      resourceName: booking.resourceName,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      _id: { $ne: id },
    });
    if (conflict) {
      throw new ConflictError(
        `Booking conflict: ${conflict.startDate.toISOString().slice(0, 10)} to ${conflict.endDate.toISOString().slice(0, 10)}`,
      );
    }
  }

  updateData.updatedAt = new Date();

  const updated = await CalendarBooking.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new NotFoundError("Booking", id);
  return { data: updated };
}

// ─── Drag-drop date change ──────────────────────────────────────────────────
async function setDates(id, { startDate, endDate, action }) {
  const booking = await CalendarBooking.findById(id);
  if (!booking) throw new NotFoundError("Booking", id);

  const newStart = new Date(startDate);
  const newEnd = new Date(endDate);

  const conflict = await CalendarBooking.findOne({
    resourceName: booking.resourceName,
    startDate: { $lte: newEnd },
    endDate: { $gte: newStart },
    _id: { $ne: id },
  });
  if (conflict) {
    throw new ConflictError(
      `Booking conflict: ${conflict.startDate.toISOString().slice(0, 10)} to ${conflict.endDate.toISOString().slice(0, 10)}`,
    );
  }

  const originalDates = { startDate: booking.startDate, endDate: booking.endDate };

  const updated = await CalendarBooking.findByIdAndUpdate(
    id,
    {
      startDate: newStart,
      endDate: newEnd,
      lastDragAction: action,
      originalDates,
      updatedAt: new Date(),
    },
    { new: true, runValidators: true },
  );

  return {
    data: updated,
    dragAction: action,
    oldDates: `${originalDates.startDate.toISOString().slice(0, 10)} to ${originalDates.endDate.toISOString().slice(0, 10)}`,
    newDates: `${newStart.toISOString().slice(0, 10)} to ${newEnd.toISOString().slice(0, 10)}`,
    totalDays: Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24)) + 1,
  };
}

// ─── Status change (with auto-stamp of checkInTime / checkOutTime) ──────────
async function setStatus(id, { status, checkInTime, checkOutTime }) {
  const update = { status, updatedAt: new Date() };
  if (status === "Checked-in" && !checkInTime) update.checkInTime = new Date();
  if (status === "Checked-out" && !checkOutTime) update.checkOutTime = new Date();

  const updated = await CalendarBooking.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new NotFoundError("Booking", id);
  return { data: updated };
}

// ─── Delete ─────────────────────────────────────────────────────────────────
async function remove(id) {
  const deleted = await CalendarBooking.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundError("Booking", id);
  return { message: "Booking deleted", data: deleted };
}

// ─── Resources (aggregate stats by resourceName) ────────────────────────────
async function resources() {
  const rows = await CalendarBooking.aggregate([
    {
      $group: {
        _id: "$resourceName",
        totalBookings: { $sum: 1 },
        activeBookings: { $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] } },
      },
    },
    {
      $project: {
        resourceName: "$_id",
        totalBookings: 1,
        activeBookings: 1,
        _id: 0,
      },
    },
  ]);
  return {
    data: rows,
    stats: {
      totalBookings: rows.reduce((s, r) => s + r.totalBookings, 0),
      totalActiveBookings: rows.reduce((s, r) => s + r.activeBookings, 0),
    },
  };
}

// ─── Build invoice (legacy: structured payload, not a real PDF) ─────────────
async function buildInvoice(id) {
  const booking = await CalendarBooking.findById(id);
  if (!booking) throw new NotFoundError("Booking", id);
  return {
    data: {
      bookingId: booking._id,
      guestName: booking.guestName,
      resourceName: booking.resourceName,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalDays: booking.totalDays,
      adults: booking.adults,
      children: booking.children,
      totalGuests: booking.totalGuests,
      basePrice: booking.basePrice,
      extraCharges: booking.extraCharges,
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
      pendingAmount: booking.pendingAmount,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      phoneNumber: booking.phoneNumber,
      email: booking.email,
      notes: booking.notes,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
      generatedAt: new Date(),
    },
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  setDates,
  setStatus,
  remove,
  resources,
  buildInvoice,
};
