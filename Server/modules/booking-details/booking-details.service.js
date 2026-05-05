/**
 * Booking-details service.
 *
 * Preserves the legacy contract: the list endpoint blends BookingDetail
 * documents with mapped Booking documents (the canonical Booking model)
 * because some clients live in only one of those two collections. The
 * mapping shapes them into the same display-ready row.
 */
const mongoose = require("mongoose");

const BookingDetail = require("../../models/BookingDetail");
const Offer = require("../../models/Offer");
const Vendor = require("../../models/Vendor");
const User = require("../../models/User");
const Booking = require("../../models/Booking");
const Management = require("../../models/Management");
const logger = require("../../shared/logger");
const { NotFoundError, UnauthorizedError, ForbiddenError } = require("../../shared/errors");

const STATUS_COLOR = {
  pending: "bg-status-orange-bg text-status-orange-text",
  confirmed: "bg-status-purple-bg text-status-purple-text",
  active: "bg-status-green-bg text-status-green-text",
  cancelled: "bg-status-red-bg text-status-red-text",
};

const SERVICE_TYPE_FROM_NAME = {
  "camper-van": "van",
  "unique-stay": "unique-stays",
};

function formatDDMMYYYY(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function isAdmin(user) {
  return (
    user.userType === "admin" ||
    user.type === "admin" ||
    user.type === "superadmin" ||
    user.role === "admin"
  );
}

// Map a canonical Booking document into the BookingDetail-shaped row that
// the vendor dashboard renders.
function mapBookingToRow(b) {
  const raw = String(b.bookingStatus || "pending").toLowerCase();
  let status = "pending";
  if (raw === "confirmed" || raw === "completed" || raw === "checked-out") status = "confirmed";
  else if (raw === "active" || raw === "checked-in") status = "active";
  else if (raw === "cancelled") status = "cancelled";

  return {
    _id: b._id,
    id: b.bookingId || b._id.toString(),
    clientName: b.clientName,
    serviceName: b.serviceId?.brandName || b.serviceName,
    servicePrice: `₹ ${b.totalAmount}`,
    checkIn: formatDDMMYYYY(b.checkInDate),
    checkOut: formatDDMMYYYY(b.checkOutDate),
    guests: b.numberOfGuests || 1,
    status,
    statusColor: STATUS_COLOR[status],
    location: b.location || "",
    contactEmail: b.clientEmail,
    contactPhone: b.clientPhone,
    serviceType: SERVICE_TYPE_FROM_NAME[b.serviceName] ?? b.serviceName,
    vendorId: b.serviceId?.vendorId,
    isFromBooking: true,
  };
}

// ─── List ───────────────────────────────────────────────────────────────────
async function list({ vendorId } = {}, user) {
  if (!user) throw new UnauthorizedError("Unauthorized access");

  // ─ Admin ─ Optionally filter by vendorId; pull both BookingDetail and
  //          (Management-owned) Booking rows.
  if (isAdmin(user)) {
    const detailFilter = vendorId ? { vendorId } : {};
    const items = await BookingDetail.find(detailFilter).sort({ createdAt: -1 });

    let serviceBookings = [];
    try {
      const bFilter = {};
      if (vendorId) {
        // Admin filter: find the vendor's Management services and scope
        // bookings to their _ids.
        const orClauses = [{ vendorId }];
        if (mongoose.Types.ObjectId.isValid(vendorId)) {
          orClauses.push({ _id: vendorId });
        }
        const vendorUser = await User.findOne({ $or: orClauses });
        if (vendorUser) {
          const mIds = await Management.find({ vendorId: vendorUser._id }).select("_id");
          bFilter.serviceId = { $in: mIds.map((s) => s._id) };
        }
      }
      serviceBookings = await Booking.find(bFilter).populate("serviceId").sort({ createdAt: -1 });
    } catch (err) {
      logger.warn({ err: err.message }, "booking-details: admin booking lookup failed");
    }

    return { data: [...items, ...serviceBookings.map(mapBookingToRow)] };
  }

  // ─ Vendor ─ Scope to bookings owned by this vendor across both collections.
  const vendor = await Vendor.findOne({ email: user.email });
  if (!vendor) {
    throw new ForbiddenError("Vendor not found");
  }

  const vendorIds = [vendor._id.toString()];
  if (vendor.vendorId) vendorIds.push(vendor.vendorId);

  // Service-name fallback: some legacy BookingDetail rows have no vendorId,
  // but their `serviceName` matches an Offer the vendor owns.
  const offers = await Offer.find({
    $or: [{ vendorId: { $in: vendorIds } }, { userId: vendor.userId || vendor._id }],
  }).select("name");
  const serviceNames = offers.map((o) => o.name);

  const filter = {
    $or: [
      { vendorId: { $in: vendorIds } },
      { serviceName: { $in: serviceNames }, vendorId: { $exists: false } },
      { serviceName: { $in: serviceNames }, vendorId: null },
      { serviceName: { $in: serviceNames }, vendorId: "" },
    ],
  };
  const items = await BookingDetail.find(filter).sort({ createdAt: -1 });

  // Also pull Booking rows tied to Management services owned by this vendor.
  let serviceBookings = [];
  try {
    const vendorUser = await User.findOne({ email: user.email });
    if (vendorUser) {
      const mServices = await Management.find({ vendorId: vendorUser._id }).select("_id brandName");
      const mIds = mServices.map((s) => s._id);
      if (mIds.length > 0) {
        serviceBookings = await Booking.find({ serviceId: { $in: mIds } }).populate("serviceId");
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, "booking-details: vendor booking lookup failed");
  }

  return { data: [...items, ...serviceBookings.map(mapBookingToRow)] };
}

// ─── Get by id ──────────────────────────────────────────────────────────────
async function getById(id, vendorId) {
  const item = await BookingDetail.findById(id);
  if (!item) throw new NotFoundError("Booking detail", id);

  // Optional ownership check when a vendorId is passed (vendor dashboard).
  // The check is intentionally permissive: a vendorId match wins; otherwise
  // we look up the vendor's offers and accept if the booking's serviceName
  // matches one. Tightening this is part of the Phase 4 RBAC sweep.
  if (vendorId) {
    if (item.vendorId && item.vendorId !== vendorId) {
      const vendor = await Vendor.findOne({ vendorId });
      const offerQuery = { $or: [{ vendorId }] };
      if (vendor?.userId) offerQuery.$or.push({ userId: vendor.userId });
      const offers = await Offer.find(offerQuery).select("name");
      const offerNames = offers.map((o) => o.name);
      if (!offerNames.includes(item.serviceName) && item.vendorId !== vendorId) {
        throw new ForbiddenError("Unauthorized access to this booking");
      }
    } else if (!item.vendorId) {
      const vendor = await Vendor.findOne({ vendorId });
      const offerQuery = { $or: [{ vendorId }] };
      if (vendor?.userId) offerQuery.$or.push({ userId: vendor.userId });
      if (mongoose.Types.ObjectId.isValid(vendorId)) {
        offerQuery.$or.push({ userId: vendorId });
      }
      const offers = await Offer.find(offerQuery).select("name");
      const offerNames = offers.map((o) => o.name);
      if (!offerNames.includes(item.serviceName)) {
        throw new ForbiddenError("Unauthorized access to this booking");
      }
    }
  }

  return { item };
}

// ─── Create ─────────────────────────────────────────────────────────────────
async function create(input, user) {
  const payload = { ...input };

  // Auto-populate vendorId from the authenticated vendor if missing.
  if (!payload.vendorId && user && (user.userType === "vendor" || user.role === "vendor")) {
    const vendor = await Vendor.findOne({ email: user.email });
    if (vendor) {
      payload.vendorId = vendor.vendorId || vendor._id.toString();
    }
  }

  // Auto-derive statusColor from status (server-controlled).
  if (payload.status) {
    payload.statusColor = STATUS_COLOR[payload.status];
  }

  // Service-name fallback for vendorId.
  if (!payload.vendorId && payload.serviceName) {
    const offer = await Offer.findOne({ name: payload.serviceName });
    if (offer?.vendorId) payload.vendorId = offer.vendorId;
  }

  const created = await BookingDetail.create(payload);
  return { created };
}

// ─── Update ─────────────────────────────────────────────────────────────────
async function update(id, patch) {
  // Re-derive statusColor if status was patched.
  const safePatch = { ...patch };
  if (safePatch.status) {
    safePatch.statusColor = STATUS_COLOR[safePatch.status];
  }
  const updated = await BookingDetail.findByIdAndUpdate(id, safePatch, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new NotFoundError("Booking detail", id);
  return { updated };
}

// ─── Remove ─────────────────────────────────────────────────────────────────
async function remove(id) {
  const deleted = await BookingDetail.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundError("Booking detail", id);
  return { message: "Booking detail deleted" };
}

// ─── Build invoice payload (legacy: not a real PDF) ─────────────────────────
async function buildInvoice(id) {
  const booking = await BookingDetail.findById(id);
  if (!booking) throw new NotFoundError("Booking detail", id);

  return {
    invoice: {
      filePath: `/invoices/BD_${booking._id}_${Date.now()}.pdf`,
      bookingId: booking._id,
      clientName: booking.clientName,
      serviceName: booking.serviceName,
      servicePrice: booking.servicePrice,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      status: booking.status,
      location: booking.location,
      contactEmail: booking.contactEmail || "",
      contactPhone: booking.contactPhone || "",
      pickupLocation: booking.pickupLocation || "",
      companyName: "Travel Homes",
      companyAddress: "Your Company Address",
      companyPhone: "Your Phone Number",
      companyEmail: "support@travelhomes.com",
    },
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  buildInvoice,
};
