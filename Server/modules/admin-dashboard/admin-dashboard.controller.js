const asyncHandler = require("../../shared/asyncHandler");
const service = require("./admin-dashboard.service");

const getStats = asyncHandler(async (_req, res) => {
  const { data } = await service.getStats();
  res.json({ success: true, data });
});

module.exports = { getStats };
