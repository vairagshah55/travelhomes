const asyncHandler = require("../../shared/asyncHandler");
const service = require("./admin-staff.service");

const list = asyncHandler(async (req, res) => {
  const result = await service.list(req.validated.query);
  res.json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const { staff } = await service.getById(req.validated.params.id);
  res.json({ success: true, staff });
});

const create = asyncHandler(async (req, res) => {
  const { staff } = await service.create(req.validated.body);
  res.status(201).json({ success: true, staff });
});

const update = asyncHandler(async (req, res) => {
  const { staff } = await service.update(req.validated.params.id, req.validated.body);
  res.json({ success: true, staff });
});

const toggleStatus = asyncHandler(async (req, res) => {
  const { data } = await service.toggleStatus(req.validated.params.id);
  res.json({ success: true, data });
});

const touchLastLogin = asyncHandler(async (req, res) => {
  const { staff } = await service.touchLastLogin(req.validated.params.id);
  res.json({ success: true, staff });
});

const remove = asyncHandler(async (req, res) => {
  const { message } = await service.remove(req.validated.params.id);
  res.json({ success: true, message });
});

const bulkStatus = asyncHandler(async (req, res) => {
  const { updatedCount } = await service.bulkStatus(req.validated.body);
  res.json({ success: true, updatedCount });
});

const statsOverview = asyncHandler(async (_req, res) => {
  const stats = await service.statsOverview();
  res.json({ success: true, ...stats });
});

module.exports = {
  list,
  getById,
  create,
  update,
  toggleStatus,
  touchLastLogin,
  remove,
  bulkStatus,
  statsOverview,
};
