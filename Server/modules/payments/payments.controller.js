/**
 * Payments controller — thin wrappers around the service layer.
 *
 * Response shapes preserve the legacy contracts:
 *   list         -> { success, data: [...] }
 *   getById      -> { success, data: {...} }
 *   create       -> { success, data: {...} } (201)
 *   update       -> { success, data: {...} }
 *   remove       -> { success, message }
 *   setStatus    -> { success, data: {...} }
 *   createOrder  -> raw Razorpay order object (legacy)
 *   verifyPayment-> { success, bookingId } | { success: false, message }
 */
const asyncHandler = require("../../shared/asyncHandler");
const service = require("./payments.service");

const list = asyncHandler(async (req, res) => {
  const { data } = await service.listPayments(req.validated.query, req.user);
  res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
  const { data } = await service.getPaymentById(req.validated.params.id);
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const { data } = await service.createPayment(req.validated.body);
  res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const { data } = await service.updatePayment(req.validated.params.id, req.validated.body);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  const { message } = await service.removePayment(req.validated.params.id);
  res.json({ success: true, message });
});

const setStatus = asyncHandler(async (req, res) => {
  const { data } = await service.setStatus(req.validated.params.id, req.validated.body.status);
  res.json({ success: true, data });
});

const createOrder = asyncHandler(async (req, res) => {
  const order = await service.createRazorpayOrder(req.validated.body);
  // Legacy clients read the order shape directly off the response.
  res.json(order);
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { bookingId } = await service.verifyRazorpayPayment(req.validated.body);
  res.json({ success: true, bookingId });
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  setStatus,
  createOrder,
  verifyPayment,
};
