const asyncHandler = require("../../shared/asyncHandler");
const service = require("./management.service");

const list = asyncHandler(async (req, res) => {
  const listings = await service.list(req.validated.query);
  res.status(200).json({ success: true, listings });
});

const getById = asyncHandler(async (req, res) => {
  const listing = await service.getById(req.validated.params.id);
  res.status(200).json({ success: true, listing });
});

const create = asyncHandler(async (req, res) => {
  const listing = await service.create(req.validated.body);
  res.status(201).json({ success: true, listing });
});

const update = asyncHandler(async (req, res) => {
  const listing = await service.update(req.validated.params.id, req.validated.body);
  res.status(200).json({ success: true, listing });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.validated.params.id);
  res.status(200).json({ success: true, deleted: true });
});

const setStatus = asyncHandler(async (req, res) => {
  const listing = await service.setStatus(req.validated.params.id, req.validated.body);
  res.status(200).json({ success: true, listing });
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  setStatus,
};
