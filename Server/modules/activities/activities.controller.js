const asyncHandler = require("../../shared/asyncHandler");
const service = require("./activities.service");

const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.list(req.validated.query);
  res.json({ success: true, data, pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await service.getById(req.validated.params.id);
  res.json({ success: true, data });
});

const listMine = asyncHandler(async (req, res) => {
  const data = await service.listMine(req.user);
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.validated.body, req.user);
  res.status(201).json({ success: true, data, message: "Activity created successfully" });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.validated.params.id, req.validated.body, req.user);
  res.json({ success: true, data, message: "Activity updated successfully" });
});

const setStatus = asyncHandler(async (req, res) => {
  const data = await service.setStatus(
    req.validated.params.id,
    req.validated.body.status,
    req.user,
  );
  res.json({ success: true, data, message: "Activity status updated successfully" });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.validated.params.id, req.user);
  res.json({ success: true, message: "Activity deleted successfully" });
});

module.exports = { list, getById, listMine, create, update, setStatus, remove };
