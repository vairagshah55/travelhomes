const asyncHandler = require("../../shared/asyncHandler");
const service = require("./trips.service");

const create = asyncHandler(async (req, res) => {
  const { data } = await service.create(req.validated.body);
  res.status(201).json({ success: true, data, message: "Trip created successfully" });
});

const list = asyncHandler(async (_req, res) => {
  const { data } = await service.list();
  res.json({ success: true, data });
});

const listToday = asyncHandler(async (_req, res) => {
  const { data } = await service.listToday();
  res.json({ success: true, data });
});

const listEndingThisWeek = asyncHandler(async (_req, res) => {
  const { data } = await service.listEndingThisWeek();
  res.json({ success: true, data });
});

module.exports = { create, list, listToday, listEndingThisWeek };
