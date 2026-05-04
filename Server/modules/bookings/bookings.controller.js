/**
 * Bookings controller — read endpoints only (Phase 1 of bookings migration).
 *
 * Authorisation policy:
 *   listByDate / getById  — public (matches legacy)
 *   listForUser           — must be authenticated AND match :userId
 */
const asyncHandler = require("../../shared/asyncHandler");
const { ForbiddenError } = require("../../shared/errors");
const service = require("./bookings.service");

const listByDate = asyncHandler(async (req, res) => {
  const { bookings } = await service.listByDate(req.validated.query.date);
  res.json({ success: true, bookings });
});

const getById = asyncHandler(async (req, res) => {
  const { booking } = await service.getById(req.validated.params.id);
  res.json({ success: true, booking });
});

const listForUser = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params;

  // requireJwt sets req.user; the user can only fetch their own bookings.
  const authUserId = req.user?._id || req.user?.id;
  if (authUserId && String(authUserId) !== String(userId)) {
    throw new ForbiddenError("Unauthorized: You can only view your own trips");
  }

  const { bookings } = await service.listForUser(userId);
  res.json({ success: true, bookings });
});

module.exports = {
  listByDate,
  getById,
  listForUser,
};
