const asyncHandler = require("../../shared/asyncHandler");
const service = require("./blogs.service");

// `pagination` is additive — existing callers read `data` and ignore it.
const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.list(req.validated.query);
  res.json({ success: true, data, pagination });
});

const categories = asyncHandler(async (req, res) => {
  const { data, total } = await service.listCategories(req.validated.query);
  res.json({ success: true, data, total });
});

const getBySlug = asyncHandler(async (req, res) => {
  const { data } = await service.getBySlug(req.validated.params.slug);
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

const remove = asyncHandler(async (req, res) => {
  const { message } = await service.remove(req.validated.params.id);
  res.json({ success: true, message });
});

module.exports = { list, categories, getBySlug, create, update, remove };
