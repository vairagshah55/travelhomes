/**
 * Zod schemas for the payments module.
 *
 * The verify-payment endpoint accepts a `booking` blob that's a superset of
 * the bookings DTO (it carries fields used to build the denormalised
 * BookingDetail + CalendarBooking documents). We validate the critical
 * security/integrity fields here; the saga layer treats the rest as
 * trusted-but-typed.
 */
const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const paymentStatus = z.enum(["pending", "paid", "requested", "processing", "refunded"]);
const serviceCategory = z.enum(["camper-van", "unique-stay", "activity"]);

// ─── GET /api/payments ──────────────────────────────────────────────────────
const listQuery = z.object({
  tab: z.enum(["payment-received", "refund-status", "vendor"]).optional(),
  serviceType: z.string().trim().max(40).optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.string().trim().max(40).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

// ─── GET /api/payments/:id ──────────────────────────────────────────────────
const getByIdParams = z.object({ id: objectIdString });

// ─── POST /api/payments — strict whitelist, no mass-assignment ──────────────
const createPaymentBody = z.object({
  businessName: z.string().trim().min(1).max(200).optional(),
  personName: z.string().trim().min(1).max(120),
  servicesNames: z
    .union([z.string().trim().max(200), z.array(z.string().trim().max(200))])
    .optional(),
  servicesId: z.string().trim().max(60).optional(),
  serviceCategory: serviceCategory.optional(),
  bookingId: z.string().trim().max(60).optional(),
  userId: z.string().trim().max(60).optional(),
  serviceId: z.string().trim().max(60).optional(),
  amount: z.number().nonnegative(),
  currency: z.string().trim().min(3).max(8).optional(),
  paymentMethod: z.string().trim().max(40),
  transactionId: z.string().trim().max(120).optional(),
  status: paymentStatus.optional(),
  paymentDate: z.iso.datetime().optional(),
  paymentGateway: z.string().trim().max(40).optional(),
  gatewayTransactionId: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
});

// ─── PUT /api/payments/:id ──────────────────────────────────────────────────
const updatePaymentParams = z.object({ id: objectIdString });
const updatePaymentBody = createPaymentBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// ─── DELETE /api/payments/:id ───────────────────────────────────────────────
const deletePaymentParams = z.object({ id: objectIdString });

// ─── PATCH /api/payments/:id/status ─────────────────────────────────────────
const updateStatusParams = z.object({ id: objectIdString });
const updateStatusBody = z.object({ status: paymentStatus });

// ─── POST /api/payments/razor/create-order ──────────────────────────────────
const createOrderBody = z.object({
  // Razorpay requires a positive integer amount (paise). Keep this simple —
  // the controller multiplies by 100.
  amount: z.number().positive().max(10_000_000),
});

// ─── POST /api/payments/razor/verify-payment ────────────────────────────────
// The `booking` blob is a fat payload from the SPA — we whitelist the
// security-critical fields and accept the rest as typed-but-untrusted strings
// to keep the migration low-risk. Phase 4 cleanup will normalise the schema.
const verifyPaymentBookingBlob = z.object({
  // Strict identity / amount fields:
  userId: z.string().trim().min(1).max(60),
  serviceId: z.string().trim().min(1).max(60),
  serviceName: z.string().trim().min(1).max(40),
  totalAmount: z.union([z.number().nonnegative(), z.string().regex(/^\d+(\.\d+)?$/)]),
  baseAmount: z.union([z.number().nonnegative(), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),

  // Booking shape:
  clientName: z.string().trim().min(1).max(120),
  clientEmail: z
    .email()
    .trim()
    .max(254)
    .transform((s) => s.toLowerCase())
    .optional(),
  clientPhone: z.string().trim().max(40).optional(),
  numberOfGuests: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]).optional(),
  checkInDate: z.union([z.iso.datetime(), z.iso.date(), z.string().min(1)]),
  checkOutDate: z.union([z.iso.datetime(), z.iso.date(), z.string().min(1)]),

  // Optional metadata used to denormalise the BookingDetail / CalendarBooking
  // documents (preserve the legacy contract here):
  bookingId: z.string().trim().max(60).optional(),
  bookingStatus: z
    .enum(["pending", "confirmed", "active", "cancelled", "checked-in", "checked-out"])
    .optional(),
  propertyName: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  pickupLocation: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const verifyPaymentBody = z.object({
  razorpay_order_id: z.string().trim().min(1).max(120),
  razorpay_payment_id: z.string().trim().min(1).max(120),
  razorpay_signature: z.string().trim().min(1).max(256),
  booking: verifyPaymentBookingBlob,
});

module.exports = {
  listQuery,
  getByIdParams,
  createPaymentBody,
  updatePaymentParams,
  updatePaymentBody,
  deletePaymentParams,
  updateStatusParams,
  updateStatusBody,
  createOrderBody,
  verifyPaymentBody,
};
