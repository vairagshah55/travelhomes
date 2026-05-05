const asyncHandler = require("../../shared/asyncHandler");
const service = require("./booking-details.service");

const list = asyncHandler(async (req, res) => {
  const { data } = await service.list(req.validated.query, req.user);
  res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
  const { item } = await service.getById(req.validated.params.id, req.validated.query.vendorId);
  res.json({ success: true, item });
});

const create = asyncHandler(async (req, res) => {
  const { created } = await service.create(req.validated.body, req.user);
  res.status(201).json({ success: true, created });
});

const update = asyncHandler(async (req, res) => {
  const { updated } = await service.update(req.validated.params.id, req.validated.body);
  res.json({ success: true, updated });
});

const remove = asyncHandler(async (req, res) => {
  const { message } = await service.remove(req.validated.params.id);
  res.json({ success: true, message });
});

const buildInvoice = asyncHandler(async (req, res) => {
  const { invoice } = await service.buildInvoice(req.validated.params.id);
  res.json({ success: true, invoice });
});

module.exports = { list, getById, create, update, remove, buildInvoice };
