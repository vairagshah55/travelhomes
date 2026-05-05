const asyncHandler = require("../../shared/asyncHandler");
const service = require("./marketing.service");

// Legacy clients consume the raw item array / single doc; preserve those shapes.
const list = asyncHandler(async (_req, res) => {
  const { data } = await service.list();
  res.json(data);
});

const create = asyncHandler(async (req, res) => {
  const { data } = await service.create(req.validated.body);
  res.status(201).json(data);
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.validated.params.id);
  res.json({ success: true });
});

const postToSocial = asyncHandler(async (req, res) => {
  const { message } = await service.postToSocial(req.validated.body);
  res.json({ success: true, message });
});

module.exports = { list, create, remove, postToSocial };
