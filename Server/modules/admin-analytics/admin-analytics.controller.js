const asyncHandler = require("../../shared/asyncHandler");
const service = require("./admin-analytics.service");

const getOverview = asyncHandler(async (_req, res) => {
  const { data } = await service.getOverview();
  res.json({ success: true, data });
});

const getReport = asyncHandler(async (req, res) => {
  const { data } = await service.getReport(req.validated.query);
  res.json({ success: true, data });
});

module.exports = { getOverview, getReport };
