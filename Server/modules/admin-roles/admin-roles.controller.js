const asyncHandler = require("../../shared/asyncHandler");
const service = require("./admin-roles.service");

const list = asyncHandler(async (req, res) => {
  const result = await service.list(req.validated.query);
  res.json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const { role } = await service.getById(req.validated.params.id);
  res.json({ success: true, role });
});

const create = asyncHandler(async (req, res) => {
  const { role } = await service.create(req.validated.body, req.user);
  res.status(201).json({ success: true, role });
});

const update = asyncHandler(async (req, res) => {
  const { role } = await service.update(req.validated.params.id, req.validated.body);
  res.json({ success: true, role });
});

const toggle = asyncHandler(async (req, res) => {
  const { role } = await service.toggle(req.validated.params.id);
  res.json({ success: true, role });
});

const remove = asyncHandler(async (req, res) => {
  const { message } = await service.remove(req.validated.params.id);
  res.json({ success: true, message });
});

const availableFeatures = asyncHandler(async (_req, res) => {
  const { features } = service.availableFeatures();
  res.json({ success: true, features });
});

const statsOverview = asyncHandler(async (_req, res) => {
  const { summary } = await service.statsOverview();
  res.json({ success: true, summary });
});

module.exports = {
  list,
  getById,
  create,
  update,
  toggle,
  remove,
  availableFeatures,
  statsOverview,
};
