const asyncHandler = require("../../shared/asyncHandler");
const service = require("./settings.service");

const getSeo = asyncHandler(async (req, res) => {
  const { data } = await service.getSeo(req.validated.query.page);
  res.json({ success: true, data });
});

const upsertSeo = asyncHandler(async (req, res) => {
  const { data } = await service.upsertSeo(req.validated.body);
  res.json({ success: true, data });
});

const getSystem = asyncHandler(async (req, res) => {
  const { data } = await service.getSystem(req.validated.query.userType);
  res.json({ success: true, data });
});

const updateSystem = asyncHandler(async (req, res) => {
  const { data } = await service.updateSystem(req.validated.body);
  res.json({ success: true, data });
});

const uploadSeoAsset = asyncHandler(async (req, res) => {
  const { data } = await service.uploadSeoAsset({
    ...req.validated.body,
    file: req.file,
  });
  res.json({ success: true, data });
});

module.exports = { getSeo, upsertSeo, getSystem, updateSystem, uploadSeoAsset };
