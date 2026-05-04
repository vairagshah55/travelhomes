/**
 * Bookings router — read endpoints only (Phase 1 of bookings migration).
 *
 * Mounted at /api/bookings BEFORE the legacy `routes/bookings.js`. Express
 * tries routers in registration order; only GET requests for the paths
 * declared here are intercepted. Everything else (POST / PUT / PATCH /
 * DELETE) falls through to the legacy router unchanged.
 *
 * The legacy router stays in place until the writes + payment saga are
 * migrated — this avoids one-shot risk while we move incrementally.
 */
const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./bookings.controller");
const dto = require("./bookings.dto");

const router = express.Router();

// GET /api/bookings?date=YYYY-MM-DD — public.
router.get("/", validate({ query: dto.listByDateQuery }), controller.listByDate);

// GET /api/bookings/user/:userId — must match the authenticated user.
// Declared BEFORE `/:id` so Express picks the static segment first.
router.get(
  "/user/:userId",
  requireJwt(),
  validate({ params: dto.listForUserParams }),
  controller.listForUser,
);

// GET /api/bookings/:id — public (matches legacy contract).
router.get("/:id", validate({ params: dto.getByIdParams }), controller.getById);

module.exports = router;
