/**
 * Bookings router — full surface (mounted at /api/bookings and
 * /api/admin/bookings from api/index.js).
 *
 * Layer order: validate -> controller (asyncHandler).
 * No rate-limit on bookings — these are not credential surfaces.
 */
const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./bookings.controller");
const dto = require("./bookings.dto");

const router = express.Router();

// ─── Reads ──────────────────────────────────────────────────────────────────

// GET /api/bookings/legacy/all — admin filter view.
// Declared first so the static segment wins over `/:id`.
router.get("/legacy/all", validate({ query: dto.listForAdminQuery }), controller.listForAdmin);

// GET /api/bookings/user/:userId — must match the authenticated user.
router.get(
  "/user/:userId",
  requireJwt(),
  validate({ params: dto.listForUserParams }),
  controller.listForUser,
);

// GET /api/bookings?date=YYYY-MM-DD — public.
router.get("/", validate({ query: dto.listByDateQuery }), controller.listByDate);

// GET /api/bookings/:id — public (matches legacy contract).
router.get("/:id", validate({ params: dto.getByIdParams }), controller.getById);

// ─── Writes ─────────────────────────────────────────────────────────────────

// POST /api/bookings — create. Strict whitelist body kills mass-assignment.
router.post("/", validate({ body: dto.createBookingBody }), controller.create);

// PUT /api/bookings/:id — update.
router.put(
  "/:id",
  validate({ params: dto.updateBookingParams, body: dto.updateBookingBody }),
  controller.update,
);

// DELETE /api/bookings/:id — delete.
router.delete("/:id", validate({ params: dto.deleteBookingParams }), controller.remove);

// PATCH /api/bookings/:id/status — status change (fires confirmation workflow
// if newly confirmed).
router.patch(
  "/:id/status",
  validate({ params: dto.updateStatusParams, body: dto.updateStatusBody }),
  controller.setStatus,
);

// PATCH /api/bookings/:id/dates — calendar drag-drop reschedule.
router.patch(
  "/:id/dates",
  validate({ params: dto.updateDatesParams, body: dto.updateDatesBody }),
  controller.setDates,
);

// POST /api/bookings/:id/invoice — non-PDF invoice payload (legacy behavior
// preserved verbatim until the invoice flow is rewritten with payments).
router.post("/:id/invoice", validate({ params: dto.invoiceParams }), controller.buildInvoice);

module.exports = router;
