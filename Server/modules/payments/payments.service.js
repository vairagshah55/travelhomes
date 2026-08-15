/**
 * Payments service.
 *
 * The marquee feature here is `createBookingRecords` — the legacy controller
 * created Booking + BookingDetail + CalendarBooking + Payment in sequence
 * with no atomicity. If any one failed, the database was left inconsistent
 * (and money had already moved on the gateway's side). This service runs all
 * four creates through `runSaga`, which uses a MongoDB transaction when
 * available and falls back to compensation otherwise.
 *
 * Two gateways live side by side. They differ in exactly one place — how a
 * payment is *proven* — and share everything after that:
 *
 *   Razorpay  Checkout hands the browser an HMAC signature over
 *             `order_id|payment_id`. Verifying it locally is proof.
 *   Cashfree  Checkout hands the browser nothing signed, so the browser's
 *             claim is worthless on its own. We ask Cashfree's API what
 *             happened to the order and trust only that answer.
 *
 * Which one the SPA should drive is `getActiveGateway()`, backed by the
 * PAYMENT_GATEWAY env var, so switching providers is a redeploy and not a
 * code change.
 */
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const cashfree = require("./cashfree.client");

const Payment = require("../../models/Payment");
const PaymentSetting = require("../../models/PaymentSetting");
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
const { notifyNewBooking, notifyPaymentReceived } = require("../../shared/bookingNotifications");
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

const GATEWAYS = ["razorpay", "cashfree"];

function isGatewayConfigured(gateway) {
  return gateway === "cashfree"
    ? cashfree.isConfigured()
    : Boolean(env.RAZOR_KEY && env.RAZOR_SECRET);
}

/**
 * The admin's choice wins; PAYMENT_GATEWAY is the fallback when no admin has
 * ever picked one. Returns the source too, so the settings screen can say
 * "inherited from env" rather than implying someone chose it.
 */
async function resolveGatewayName() {
  // readyState 1 is "connected". Querying in any other state parks the call in
  // mongoose's buffer until it times out — tens of seconds of a customer
  // staring at a dead checkout button, when the env var is already a usable
  // answer. Check first, and never wait long even when connected.
  if (mongoose.connection.readyState === 1) {
    try {
      const setting = await PaymentSetting.findOne({ key: "gateway" })
        .select("gateway")
        .maxTimeMS(2000)
        .lean();
      if (setting?.gateway && GATEWAYS.includes(setting.gateway)) {
        return { gateway: setting.gateway, source: "admin" };
      }
    } catch (err) {
      // A settings read must never take checkout down with it.
      logger.warn({ err: err.message }, "payment gateway setting unreadable, falling back to env");
    }
  }
  return { gateway: env.PAYMENT_GATEWAY, source: "env" };
}

/**
 * Which gateway the SPA should drive, plus whatever that gateway needs the
 * browser to know. Razorpay's checkout needs the public key id in the
 * browser; Cashfree's needs only the mode (the session id comes per-order),
 * so no Cashfree credential is ever shipped to the client.
 */
async function getActiveGateway() {
  const { gateway } = await resolveGatewayName();
  if (gateway === "cashfree") {
    return {
      gateway,
      mode: env.CASHFREE_ENV === "PROD" ? "production" : "sandbox",
      configured: cashfree.isConfigured(),
    };
  }
  return {
    gateway: "razorpay",
    key: env.RAZOR_KEY || null,
    configured: isGatewayConfigured("razorpay"),
  };
}

/** Admin view: the current choice plus what else could be picked. */
async function getGatewaySettings() {
  const { gateway, source } = await resolveGatewayName();
  return {
    gateway,
    source,
    envDefault: env.PAYMENT_GATEWAY,
    options: [
      { id: "razorpay", label: "Razorpay", configured: isGatewayConfigured("razorpay") },
      {
        id: "cashfree",
        label: "Cashfree",
        configured: isGatewayConfigured("cashfree"),
        mode: env.CASHFREE_ENV === "PROD" ? "production" : "sandbox",
      },
    ],
  };
}

async function setActiveGateway({ gateway, updatedBy }) {
  // Refuse to point checkout at a gateway with no credentials — the failure
  // would otherwise surface to a customer mid-payment rather than here.
  if (!isGatewayConfigured(gateway)) {
    throw new BadRequestError(
      `${gateway} has no API credentials configured on the server. Add them before switching.`,
    );
  }

  await PaymentSetting.findOneAndUpdate(
    { key: "gateway" },
    { $set: { gateway, updatedBy: updatedBy || "" } },
    { new: true, upsert: true },
  );
  logger.info({ gateway, updatedBy }, "payment gateway switched");
  return getGatewaySettings();
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

// ─── saga create of 4 documents, shared by every gateway ────────────────────
/**
 * Turns a *proven* payment into the four documents a booking is made of.
 *
 * Callers must have established that the money actually moved before getting
 * here — this function takes that on trust. `transactionId` is the gateway's
 * payment id and `gateway` names the provider, and both flow into the Payment
 * document so refunds and reconciliation can find their way back.
 */
async function createBookingRecords({ booking, transactionId, gateway }) {
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
            transactionId,
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
            paymentMethod: gateway,
            transactionId,
            status: "paid",
            paymentDate: new Date(),
            paymentGateway: gateway,
            gatewayTransactionId: transactionId,
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
    { name: `${gateway}-verify` },
  );

  // 5) Tell everyone — guest, vendor and admin, bell and email. Fire and
  //    forget: the saga has committed and the money has moved, so a dead SMTP
  //    host must not turn a successful payment into a failed request. This
  //    used to be two admin-only bells, which is why paying customers heard
  //    nothing back and vendors never learned they'd been booked.
  //
  //    `propertyName` isn't a Booking field — it rides along on the request
  //    blob and is what the guest actually recognises, so pass it through for
  //    the email copy rather than falling back to "unique-stay". The notifier
  //    only reads fields, so a plain object is enough.
  const bookingForNotify = { ...createdBooking.toObject(), propertyName: booking.propertyName };

  notifyNewBooking(bookingForNotify, { gateway }).catch((err) =>
    logger.error({ err: err.message }, "verify-payment: booking notifications failed"),
  );
  notifyPaymentReceived(createdPayment, { gateway }).catch((err) =>
    logger.error({ err: err.message }, "verify-payment: payment notification failed"),
  );

  return { bookingId: createdBooking.bookingId };
}

// ─── Razorpay: prove by local HMAC ──────────────────────────────────────────
async function verifyRazorpayPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  booking,
}) {
  // Verify HMAC signature against the Razorpay secret. This is the integrity
  // check — without it any client could trigger booking creation by hitting
  // this endpoint.
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

  return createBookingRecords({
    booking,
    transactionId: razorpay_payment_id,
    gateway: "razorpay",
  });
}

// ─── Cashfree: prove by asking Cashfree ─────────────────────────────────────
async function createCashfreeOrder({ amount, customer, note }) {
  // Our own order id, so verify can look the order up without trusting the
  // browser to echo back whatever Cashfree generated.
  const orderId = `th_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const order = await cashfree.createOrder({
    orderId,
    amount,
    note,
    customer: {
      id: customer.id || `guest_${crypto.randomBytes(6).toString("hex")}`,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  });

  // Only what the browser needs. The session id is single-order and useless
  // without Cashfree's own checkout, so it is safe to hand over.
  return {
    orderId: order.order_id,
    paymentSessionId: order.payment_session_id,
    amount: order.order_amount,
    currency: order.order_currency,
  };
}

async function verifyCashfreePayment({ cashfree_order_id, booking }) {
  // The browser tells us *which* order to check and nothing more — the answer
  // comes from Cashfree. A forged request buys an attacker a lookup of an
  // order that was never paid, and a 400.
  const payments = await cashfree.fetchOrderPayments(cashfree_order_id);
  const settled = payments.find((p) => p.payment_status === "SUCCESS");
  if (!settled) {
    throw new BadRequestError("Payment not completed");
  }

  // Guard the amount too. Without this, a client could pay for a ₹1 order and
  // post a booking blob claiming ₹50,000 — the payment would verify fine
  // because it really did succeed, just not for the amount being claimed.
  const paid = Number(settled.payment_amount);
  const claimed = Number(booking.totalAmount);
  if (!Number.isFinite(paid) || Math.abs(paid - claimed) > 0.01) {
    throw new BadRequestError("Paid amount does not match the booking total");
  }

  const transactionId = String(settled.cf_payment_id);

  // Cashfree can land here twice — the checkout callback and a return_url
  // redirect both race to confirm the same order. Creating the booking twice
  // would double-book the calendar, so the first one through wins and the
  // second gets the same answer back.
  const existing = await Payment.findOne({
    paymentGateway: "cashfree",
    gatewayTransactionId: transactionId,
  })
    .select("bookingId")
    .lean();
  if (existing) {
    logger.info({ transactionId }, "cashfree-verify: replaying already-confirmed payment");
    return { bookingId: existing.bookingId };
  }

  return createBookingRecords({ booking, transactionId, gateway: "cashfree" });
}

module.exports = {
  listPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  removePayment,
  setStatus,
  getActiveGateway,
  getGatewaySettings,
  setActiveGateway,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createCashfreeOrder,
  verifyCashfreePayment,
};
