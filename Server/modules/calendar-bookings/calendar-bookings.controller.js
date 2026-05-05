const asyncHandler = require("../../shared/asyncHandler");
const service = require("./calendar-bookings.service");

const list = asyncHandler(async (req, res) => {
  const { data, pagination, meta } = await service.list(req.validated.query);
  res.json({
    success: true,
    data,
    pagination,
    meta: { ...meta, filters: req.validated.query },
  });
});

const getById = asyncHandler(async (req, res) => {
  const { data } = await service.getById(req.validated.params.id);
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const { data } = await service.create(req.validated.body);
  res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const { data } = await service.update(req.validated.params.id, req.validated.body);
  res.json({ success: true, data });
});

const setDates = asyncHandler(async (req, res) => {
  const result = await service.setDates(req.validated.params.id, req.validated.body);
  res.json({ success: true, ...result });
});

const setStatus = asyncHandler(async (req, res) => {
  const { data } = await service.setStatus(req.validated.params.id, req.validated.body);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  const { message, data } = await service.remove(req.validated.params.id);
  res.json({ success: true, message, data });
});

const resources = asyncHandler(async (_req, res) => {
  const { data, stats } = await service.resources();
  res.json({ success: true, data, stats });
});

const buildInvoice = asyncHandler(async (req, res) => {
  const { data } = await service.buildInvoice(req.validated.params.id);
  res.json({ success: true, data });
});

module.exports = {
  list,
  getById,
  create,
  update,
  setDates,
  setStatus,
  remove,
  resources,
  buildInvoice,
};
