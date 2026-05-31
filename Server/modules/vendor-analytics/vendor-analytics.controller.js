const asyncHandler = require("../../shared/asyncHandler");
const service = require("./vendor-analytics.service");

const getCounts = asyncHandler(async (req, res) => {
  const { data } = await service.getCounts(req.user);
  res.json({ success: true, data });
});

const createSnapshot = asyncHandler(async (_req, res) => {
  const { data } = await service.createSnapshot();
  res.status(201).json({ success: true, data });
});

const getLatestSnapshot = asyncHandler(async (_req, res) => {
  const { data } = await service.getLatestSnapshot();
  res.json({ success: true, data });
});

const getGraphs = asyncHandler(async (req, res) => {
  // Pass req.user so the chart's visitor aggregation is scoped to THIS
  // vendor's offers — matches the KPI card. Without the user, the chart
  // falls back to platform-wide totals.
  const { data } = await service.getGraphs(req.validated.query, req.user);
  res.json({ success: true, data });
});

const resetMetrics = asyncHandler(async (_req, res) => {
  const { message } = await service.resetMetrics();
  res.json({ success: true, message });
});

module.exports = { getCounts, createSnapshot, getLatestSnapshot, getGraphs, resetMetrics };
