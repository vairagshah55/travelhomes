/**
 * Zod schemas for the booking-details module.
 *
 * BookingDetail is a denormalised view of Booking that drives the vendor
 * dashboard. It carries display-shaped fields (formatted dates, statusColor
 * Tailwind classes, etc.) and is created alongside Booking inside the
 * Razorpay verify saga (modules/payments).
 */
const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const detailStatus = z.enum(["pending", "confirmed", "active", "cancelled"]);

const isoDateLoose = z.union([z.iso.datetime(), z.iso.date(), z.string().min(1)]);

// ─── GET /api/bookingDetails ────────────────────────────────────────────────
const listQuery = z.object({
  // Admin can filter by vendorId. Vendors are auto-scoped to their own.
  vendorId: z.string().trim().max(60).optional(),
});

// ─── GET /api/bookingDetails/:id ────────────────────────────────────────────
const getByIdParams = z.object({ id: objectIdString });
const getByIdQuery = z.object({
  // Optional ownership check (e.g. vendor dashboard passes its own vendorId).
  vendorId: z.string().trim().max(60).optional(),
});

// ─── POST /api/bookingDetails ───────────────────────────────────────────────
// Strict whitelist. Server auto-populates vendorId/statusColor from context
// when missing — see the service.
const createBody = z.object({
  id: z.string().trim().max(60).optional(),
  clientName: z.string().trim().min(1).max(120),
  serviceName: z.string().trim().min(1).max(200),
  servicePrice: z.union([z.number().nonnegative(), z.string().trim().max(40)]).optional(),
  checkIn: isoDateLoose.optional(),
  checkOut: isoDateLoose.optional(),
  guests: z.number().int().nonnegative().max(100).optional(),
  status: detailStatus.optional(),
  // statusColor is server-derived from status; reject if a client tries to
  // set it directly. (Phase 4 will move statusColor out of the API and into
  // the client.)
  location: z.string().trim().max(200).optional(),
  contactEmail: z.email().trim().max(254).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  pickupLocation: z.string().trim().max(200).optional(),
  vendorId: z.string().trim().max(60).optional(),
});

// ─── PUT /api/bookingDetails/:id ────────────────────────────────────────────
const updateParams = z.object({ id: objectIdString });
const updateBody = createBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// ─── DELETE /api/bookingDetails/:id ─────────────────────────────────────────
const deleteParams = z.object({ id: objectIdString });

// ─── POST /api/bookingDetails/:id/invoice ───────────────────────────────────
const invoiceParams = z.object({ id: objectIdString });

module.exports = {
  listQuery,
  getByIdParams,
  getByIdQuery,
  createBody,
  updateParams,
  updateBody,
  deleteParams,
  invoiceParams,
};
