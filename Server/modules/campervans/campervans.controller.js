const asyncHandler = require("../../shared/asyncHandler");
const service = require("./campervans.service");

const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.list(req.validated.query);
  res.status(200).json({ success: true, data, pagination });
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
  const data = await service.remove(req.validated.params.id);
  res.json({ success: true, message: "Deleted", data });
});

const setStatus = asyncHandler(async (req, res) => {
  const data = await service.setStatus(req.validated.params.id, req.validated.body.status);
  res.json({ success: true, data });
});

module.exports = { list, create, getById, update, remove, setStatus };
