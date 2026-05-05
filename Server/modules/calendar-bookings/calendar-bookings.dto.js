/**
 * Zod schemas for the calendar-bookings module.
 *
 * CalendarBooking is the third copy of the booking record (alongside Booking
 * and BookingDetail) that drives the calendar drag-drop UI. Status values
 * here are PascalCase, distinct from the bookings module's lowercase set.
 */
const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

// PascalCase enum is the legacy contract on this collection.
const calendarStatus = z.enum(["Confirmed", "Checked-in", "Checked-out", "Cancelled"]);

const isoDate = z.union([z.iso.datetime(), z.iso.date()]);

// ─── GET /api/calendarbooking ───────────────────────────────────────────────
const listQuery = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  resource: z.string().trim().max(200).optional(),
  status: z.string().trim().max(40).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
  vendorId: z.string().trim().max(60).optional(),
  vendorEmail: z.email().trim().max(254).optional(),
});

// ─── GET /api/calendarbooking/:id ───────────────────────────────────────────
const getByIdParams = z.object({ id: objectIdString });

// ─── POST /api/calendarbooking ──────────────────────────────────────────────
// Strict whitelist. Required: guestName, resourceName, startDate, endDate.
const createBody = z
  .object({
    bookingId: z.string().trim().max(60).optional(),
    guestName: z.string().trim().min(1).max(120),
    resourceName: z.string().trim().min(1).max(200),
    startDate: isoDate,
    endDate: isoDate,
    adults: z.number().int().nonnegative().max(100).optional(),
    children: z.number().int().nonnegative().max(100).optional(),
    basePrice: z.number().nonnegative().optional(),
    totalAmount: z.number().nonnegative().optional(),
    paidAmount: z.number().nonnegative().optional(),
    pendingAmount: z.number().nonnegative().optional(),
    paymentMethod: z.string().trim().max(40).optional(),
    paymentStatus: z.enum(["paid", "pending", "failed", "refunded"]).optional(),
    transactionId: z.string().trim().max(120).optional(),
    paidAt: isoDate.optional(),
    status: calendarStatus.optional(),
    phoneNumber: z.string().trim().max(40).optional(),
    email: z.email().trim().max(254).optional(),
    notes: z.string().trim().max(2000).optional(),
    specialRequests: z.string().trim().max(2000).optional(),
    extraCharges: z.number().nonnegative().optional(),
    vendorId: z.string().trim().max(60).optional(),
  })
  .refine((d) => new Date(d.startDate) <= new Date(d.endDate), {
    message: "Start date cannot be after end date",
    path: ["startDate"],
  });

// ─── PUT /api/calendarbooking/:id ───────────────────────────────────────────
const updateParams = z.object({ id: objectIdString });
const updateBody = z
  .object({
    bookingId: z.string().trim().max(60).optional(),
    guestName: z.string().trim().min(1).max(120).optional(),
    resourceName: z.string().trim().min(1).max(200).optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    adults: z.number().int().nonnegative().max(100).optional(),
    children: z.number().int().nonnegative().max(100).optional(),
    basePrice: z.number().nonnegative().optional(),
    totalAmount: z.number().nonnegative().optional(),
    paidAmount: z.number().nonnegative().optional(),
    pendingAmount: z.number().nonnegative().optional(),
    paymentMethod: z.string().trim().max(40).optional(),
    paymentStatus: z.enum(["paid", "pending", "failed", "refunded"]).optional(),
    transactionId: z.string().trim().max(120).optional(),
    paidAt: isoDate.optional(),
    status: calendarStatus.optional(),
    phoneNumber: z.string().trim().max(40).optional(),
    email: z.email().trim().max(254).optional(),
    notes: z.string().trim().max(2000).optional(),
    specialRequests: z.string().trim().max(2000).optional(),
    extraCharges: z.number().nonnegative().optional(),
    vendorId: z.string().trim().max(60).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

// ─── PATCH /api/calendarbooking/:id/dates ───────────────────────────────────
const updateDatesParams = z.object({ id: objectIdString });
const updateDatesBody = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    action: z.string().trim().max(40).optional(),
  })
  .refine((d) => new Date(d.startDate) <= new Date(d.endDate), {
    message: "Start date cannot be after end date",
    path: ["startDate"],
  });

// ─── PATCH /api/calendarbooking/:id/status ──────────────────────────────────
const updateStatusParams = z.object({ id: objectIdString });
const updateStatusBody = z.object({
  status: calendarStatus,
  checkInTime: isoDate.optional(),
  checkOutTime: isoDate.optional(),
});

// ─── DELETE /api/calendarbooking/:id ────────────────────────────────────────
const deleteParams = z.object({ id: objectIdString });

// ─── GET /api/calendarbooking/:id/invoice ───────────────────────────────────
const invoiceParams = z.object({ id: objectIdString });

module.exports = {
  listQuery,
  getByIdParams,
  createBody,
  updateParams,
  updateBody,
  updateDatesParams,
  updateDatesBody,
  updateStatusParams,
  updateStatusBody,
  deleteParams,
  invoiceParams,
};
