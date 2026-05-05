const asyncHandler = require("../../shared/asyncHandler");
const service = require("./subscribers.service");

const subscribe = asyncHandler(async (req, res) => {
  const { message, data } = await service.subscribe(req.validated.body);
  res.status(201).json({ success: true, message, data });
});

const list = asyncHandler(async (_req, res) => {
  const { count, data } = await service.list();
  res.json({ success: true, count, data });
});

module.exports = { subscribe, list };
