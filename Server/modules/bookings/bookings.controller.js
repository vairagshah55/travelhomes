/**
 * Bookings controller — full surface (reads + writes).
 *
 * Authorisation policy:
 *   - listByDate / getById / create / update / remove / setStatus /
 *     setDates / buildInvoice / listForAdmin: public at the legacy contract.
 *     The legacy controller did not gate these — gating is being added
 *     incrementally as part of the Phase 4 RBAC sweep.
 *   - listForUser: must be authenticated AND match :userId.
 */
const asyncHandler = require("../../shared/asyncHandler");
const { ForbiddenError } = require("../../shared/errors");
const service = require("./bookings.service");

// ─── Reads ──────────────────────────────────────────────────────────────────
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
  const authUserId = req.user?._id || req.user?.id;
  if (authUserId && String(authUserId) !== String(userId)) {
    throw new ForbiddenError("Unauthorized: You can only view your own trips");
  }
  const { bookings } = await service.listForUser(userId);
  res.json({ success: true, bookings });
});

const listForAdmin = asyncHandler(async (req, res) => {
  const { bookings } = await service.listForAdmin(req.validated.query);
  // Legacy clients read either `data` or `bookings`; emit both.
  res.json({ success: true, data: bookings, bookings });
});

// ─── Writes ─────────────────────────────────────────────────────────────────
const create = asyncHandler(async (req, res) => {
  const { booking } = await service.create(req.validated.body);
  res.status(201).json({ success: true, booking });
});

const update = asyncHandler(async (req, res) => {
  const { booking } = await service.update(req.validated.params.id, req.validated.body);
  res.json({ success: true, booking });
});

const remove = asyncHandler(async (req, res) => {
  const { message } = await service.remove(req.validated.params.id);
  res.json({ success: true, message });
});

const setStatus = asyncHandler(async (req, res) => {
  const { booking } = await service.setStatus(req.validated.params.id, req.validated.body.status);
  res.json({ success: true, booking });
});

const setDates = asyncHandler(async (req, res) => {
  const { booking } = await service.setDates(req.validated.params.id, req.validated.body);
  res.json({ success: true, booking });
});

const buildInvoice = asyncHandler(async (req, res) => {
  const { invoice } = await service.buildInvoice(req.validated.params.id);
  res.json({ success: true, invoice });
});

module.exports = {
  listByDate,
  getById,
  listForUser,
  listForAdmin,
  create,
  update,
  remove,
  setStatus,
  setDates,
  buildInvoice,
};
