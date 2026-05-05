const asyncHandler = require("../../shared/asyncHandler");
const service = require("./stays.service");

const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.list(req.validated.query);
  res.json({ success: true, data, pagination });
});

const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.validated.body);
  res.status(201).json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await service.getById(req.validated.params.id);
  res.json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.validated.params.id, req.validated.body);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.validated.params.id);
  res.json({ success: true, message: "Stay deleted successfully" });
});

module.exports = { list, create, getById, update, remove };
