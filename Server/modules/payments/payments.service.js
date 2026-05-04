/**
 * Payments service.
 *
 * The marquee feature here is `verifyRazorpayPayment` — the legacy controller
 * created Booking + BookingDetail + CalendarBooking + Payment in sequence
 * with no atomicity. If any one failed, the database was left inconsistent
 * (and money had already moved on Razorpay's side). This service runs all
 * four creates through `runSaga`, which uses a MongoDB transaction when
 * available and falls back to compensation otherwise.
 */
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Payment = require("../../models/Payment");
const Notification = require("../../models/Notification");
const Booking = require("../../models/Booking");
const BookingDetail = require("../../models/BookingDetail");
const CalendarBooking = require("../../models/CalendarBooking");
const Management = require("../../models/Management");
const Offer = require("../../models/Offer");
const Vendor = require("../../models/Vendor");

const env = require("../../config/env");
const logger = require("../../shared/logger");
const { runSaga } = require("../../shared/saga");
const {
  AppError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../../shared/errors");

// ─── Shared helpers ─────────────────────────────────────────────────────────
function razorpayClient() {
  if (!env.RAZOR_KEY || !env.RAZOR_SECRET) {
    throw new AppError(
      "RAZORPAY_NOT_CONFIGURED",
      503,
      "Payment gateway is not configured on the server.",
    );
  }
  return new Razorpay({ key_id: env.RAZOR_KEY, key_secret: env.RAZOR_SECRET });
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Reads ──────────────────────────────────────────────────────────────────
async function listPayments({ tab, serviceType, search, sortBy, sortDir }, user) {
  // Vendor-payouts view: bookings where user has paid and admin owes vendor.
  if (tab === "vendor") {
    if (serviceType === "paid") {
      // Vendor payouts aren't tracked yet (legacy behavior preserved).
      return { data: [] };
    }

    const query = {
      bookingStatus: { $in: ["confirmed", "active", "completed", "checked-in", "checked-out"] },
    };
    if (search) {
      const re = new RegExp(escapeRegex(search), "i");
      query.$or = [{ bookingId: re }, { clientName: re }];
    }

    const bookings = await Booking.find(query)
      .populate({
        path: "serviceId",
        select: "brandName vendorId serviceName",
        populate: { path: "vendorId", select: "personName brandName" },
      })
      .lean();

    let data = bookings.map((b) => {
      const service = b.serviceId || {};
      const vendor = service.vendorId || {};
      return {
        _id: b._id,
        paymentId: b.bookingId,
        businessName: service.brandName || service.serviceName || "N/A",
        personName: vendor.personName || "Unknown Vendor",
        servicesId: service._id ? service._id.toString() : "N/A",
        servicesNames: service.serviceName || b.serviceName || "Service",
        status: "pending",
        amount: b.totalAmount,
        paymentMode: b.paymentDetails?.paymentMethod || "N/A",
        transactionId: b.paymentDetails?.transactionId || "N/A",
        date: b.createdAt,
      };
    });

    // The vendor-name search field came from population, so we filter
    // client-side here rather than encoding it in the Mongo query.
    if (search) {
      const s = String(search).toLowerCase();
      data = data.filter(
        (p) =>
          p.paymentId?.toLowerCase().includes(s) ||
          p.businessName.toLowerCase().includes(s) ||
          p.personName.toLowerCase().includes(s) ||
          p.servicesNames.toLowerCase().includes(s),
      );
    }
    if (sortBy) {
      const dir = sortDir === "desc" ? -1 : 1;
      data.sort((a, b) => {
        let va = a[sortBy] ?? "";
        let vb = b[sortBy] ?? "";
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    }
    return { data };
  }

  // Incoming payments + refund status view.
  if (!user) throw new UnauthorizedError("Authentication required");

  const isAdmin =
    user.userType === "admin" ||
    user.type === "admin" ||
    user.type === "superadmin" ||
    user.role === "admin";

  const query = {};
  if (!isAdmin && user.userType === "vendor") {
    const currentUserId = user._id || user.id;
    const v = await Vendor.findOne({ email: user.email });
    const offerQuery = { $or: [{ userId: currentUserId }] };
    if (v?.vendorId) offerQuery.$or.push({ vendorId: v.vendorId });
    const offers = await Offer.find(offerQuery).select("name");
    const myServiceNames = offers.map((o) => o.name);
    if (myServiceNames.length === 0) return { data: [] };
    query.servicesNames = { $in: myServiceNames };
  }

  if (tab === "refund-status") {
    query.status = { $in: ["requested", "processing", "refunded"] };
  }
  if (serviceType && ["camper-van", "unique-stay", "activity"].includes(serviceType)) {
    query.serviceCategory = serviceType;
  }
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { paymentId: re },
      { businessName: re },
      { personName: re },
      { servicesId: re },
      { servicesNames: re },
      { transactionId: re },
    ];
  }

  let cursor = Payment.find(query);
  if (sortBy) {
    cursor = cursor.sort({ [sortBy]: sortDir === "desc" ? -1 : 1 });
  }
  const data = await cursor.exec();
  return { data };
}

async function getPaymentById(id) {
  const payment = await Payment.findById(id);
  if (!payment) throw new NotFoundError("Payment", id);
  return { data: payment };
}

// ─── Writes ─────────────────────────────────────────────────────────────────
async function createPayment(input) {
  const created = await Payment.create(input);
  // Best-effort notification — failures don't fail the create.
  Notification.create({
    type: "payment_received",
    title: "Payment Received",
    message: `Payment received from ${created.personName}.`,
    referenceId: created._id,
    referenceModel: "Payment",
  }).catch((err) => logger.error({ err: err.message }, "payment notification failed"));
  return { data: created };
}

async function updatePayment(id, patch) {
  const payment = await Payment.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!payment) throw new NotFoundError("Payment", id);
  return { data: payment };
}

async function removePayment(id) {
  const doc = await Payment.findById(id);
  if (!doc) throw new NotFoundError("Payment", id);
  await doc.deleteOne();
  return { message: "Payment deleted successfully" };
}

async function setStatus(id, status) {
  const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true });
  if (!payment) throw new NotFoundError("Payment", id);
  return { data: payment };
}

async function createRazorpayOrder({ amount }) {
  const razorpay = razorpayClient();
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });
  return order;
}

// ─── verify Razorpay payment + saga create of 4 documents ───────────────────
async function verifyRazorpayPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  booking,
}) {
  // 1) Verify HMAC signature against the Razorpay secret. This is the
  //    integrity check — without it any client could trigger booking
  //    creation by hitting this endpoint.
  if (!env.RAZOR_SECRET) {
    throw new AppError("RAZORPAY_NOT_CONFIGURED", 503, "Payment gateway is not configured.");
  }

  const expectedSign = crypto
    .createHmac("sha256", env.RAZOR_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // Constant-time compare to avoid timing-side-channel signature recovery.
  const sigBuf = Buffer.from(razorpay_signature, "utf8");
  const expBuf = Buffer.from(expectedSign, "utf8");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new BadRequestError("Invalid signature");
  }

  // 2) Resolve the service to find vendorId + which model (Management or
  //    Offer) it lives in. These are read-only lookups — no harm if they
  //    happen outside the saga.
  let actualVendorId = "";
  let serviceModel = "Management";
  if (booking.serviceId) {
    try {
      const mgmt = await Management.findById(booking.serviceId);
      if (mgmt?.vendorId) {
        actualVendorId = mgmt.vendorId.toString();
      } else {
        const offer = await Offer.findById(booking.serviceId);
        if (offer) {
          serviceModel = "Offer";
          actualVendorId = offer.vendorId || offer.userId || "";
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, "verify-payment: vendor lookup failed");
    }
  }

  // 3) Coerce loose strings/numbers into the right types before they hit
  //    Mongoose. The legacy controller did this inline.
  const totalAmount = Number(booking.totalAmount);
  const baseAmount = Number(booking.baseAmount ?? booking.totalAmount);
  const guests = Number(booking.numberOfGuests) || 1;

  const bookingForSave = { ...booking, serviceModel };
  if (mongoose.Types.ObjectId.isValid(bookingForSave.userId)) {
    bookingForSave.userId = new mongoose.Types.ObjectId(bookingForSave.userId);
  }
  if (mongoose.Types.ObjectId.isValid(bookingForSave.serviceId)) {
    bookingForSave.serviceId = new mongoose.Types.ObjectId(bookingForSave.serviceId);
  }

  const bookingStatusMap = {
    pending: "pending",
    confirmed: "confirmed",
    active: "active",
    cancelled: "cancelled",
  };
  const statusColorMap = {
    pending: "bg-status-orange-bg text-status-orange-text",
    confirmed: "bg-status-purple-bg text-status-purple-text",
    active: "bg-status-green-bg text-status-green-text",
    cancelled: "bg-status-red-bg text-status-red-text",
  };
  const detailStatus = bookingStatusMap[booking.bookingStatus] || "confirmed";
  const calendarStatus =
    detailStatus === "confirmed"
      ? "Confirmed"
      : detailStatus === "active"
        ? "Checked-in"
        : detailStatus === "cancelled"
          ? "Cancelled"
          : "Confirmed";

  // 4) Run the four creates as a saga — atomic via transaction when the
  //    deployment supports it; serial+compensating-deletes otherwise.
  let createdBooking;
  let createdPayment;
  await runSaga(
    [
      {
        do: async (session) => {
          const doc = new Booking(bookingForSave);
          await doc.save(session ? { session } : undefined);
          createdBooking = doc;
          return doc;
        },
        undo: async (doc) => {
          if (doc?._id) await Booking.deleteOne({ _id: doc._id });
        },
      },
      {
        do: async (session) => {
          const detailId = booking.bookingId || createdBooking.bookingId;
          const doc = new BookingDetail({
            id: detailId,
            clientName: booking.clientName,
            serviceName: booking.propertyName || "Service",
            servicePrice: totalAmount,
            checkIn: new Date(booking.checkInDate),
            checkOut: new Date(booking.checkOutDate),
            guests,
            status: detailStatus,
            statusColor: statusColorMap[detailStatus],
            location: booking.location || "",
            contactEmail: booking.clientEmail || "",
            contactPhone: booking.clientPhone || "",
            pickupLocation: booking.pickupLocation || "",
            vendorId: actualVendorId || booking.userId || "",
          });
          await doc.save(session ? { session } : undefined);
          return doc;
        },
        undo: async (doc) => {
          if (doc?._id) await BookingDetail.deleteOne({ _id: doc._id });
        },
      },
      {
        do: async (session) => {
          const doc = new CalendarBooking({
            bookingId: booking.bookingId || createdBooking.bookingId,
            guestName: booking.clientName,
            resourceName: booking.propertyName || "Service",
            startDate: new Date(booking.checkInDate),
            endDate: new Date(booking.checkOutDate),
            adults: guests,
            children: 0,
            basePrice: baseAmount,
            totalAmount,
            paidAmount: totalAmount,
            pendingAmount: 0,
            paymentMethod: "upi",
            paymentStatus: "paid",
            transactionId: razorpay_payment_id,
            paidAt: new Date(),
            status: calendarStatus,
            phoneNumber: booking.clientPhone || "",
            email: booking.clientEmail || "",
            notes: booking.notes || "",
            vendorId: actualVendorId || "",
          });
          await doc.save(session ? { session } : undefined);
          return doc;
        },
        undo: async (doc) => {
          if (doc?._id) await CalendarBooking.deleteOne({ _id: doc._id });
        },
      },
      {
        do: async (session) => {
          const doc = new Payment({
            businessName: booking.propertyName || "Travel Homes",
            personName: booking.clientName,
            servicesNames: [booking.propertyName || "Service"],
            serviceCategory: booking.serviceName,
            bookingId: booking.bookingId || createdBooking.bookingId,
            userId: booking.userId,
            serviceId: booking.serviceId,
            amount: totalAmount,
            currency: "INR",
            paymentMethod: "razorpay",
            transactionId: razorpay_payment_id,
            status: "paid",
            paymentDate: new Date(),
            paymentGateway: "razorpay",
            gatewayTransactionId: razorpay_payment_id,
            description: `Payment for booking ${booking.bookingId || createdBooking.bookingId}`,
          });
          await doc.save(session ? { session } : undefined);
          createdPayment = doc;
          return doc;
        },
        undo: async (doc) => {
          if (doc?._id) await Payment.deleteOne({ _id: doc._id });
        },
      },
    ],
    { name: "razorpay-verify" },
  );

  // 5) Notifications — best-effort, fire-and-forget. Failures here don't
  //    invalidate the saga (it's already committed) and shouldn't fail the
  //    HTTP response.
  Notification.create({
    type: "new_booking",
    title: "New Booking Received",
    message: `New booking ${createdBooking.bookingId} created by ${createdBooking.clientName}.`,
    recipientRole: "admin",
    referenceId: createdBooking._id,
    referenceModel: "Booking",
  }).catch((err) =>
    logger.error({ err: err.message }, "verify-payment: booking notification failed"),
  );

  Notification.create({
    type: "payment_received",
    title: "Payment Received",
    message: `Payment of ₹${createdPayment.amount} received from ${createdPayment.personName}.`,
    recipientRole: "admin",
    referenceId: createdPayment._id,
    referenceModel: "Payment",
  }).catch((err) =>
    logger.error({ err: err.message }, "verify-payment: payment notification failed"),
  );

  return { bookingId: createdBooking.bookingId };
}

module.exports = {
  listPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  removePayment,
  setStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
