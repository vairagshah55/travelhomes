const asyncHandler = require("../../shared/asyncHandler");
const service = require("./profile.service");

const get = asyncHandler(async (req, res) => {
  // /api/profile/:email or /api/profile?email=...
  const email = req.validated.params?.email || req.validated.query?.email;
  const { data } = await service.getByEmail(email);
  res.json({ success: true, data });
});

const upsert = asyncHandler(async (req, res) => {
  const { data } = await service.upsert(req.validated.body);
  res.json({ success: true, data });
});

const uploadPhoto = asyncHandler(async (req, res) => {
  const email = req.validated.body?.email || req.query.email;
  const { data, url } = await service.uploadPhoto({ email, file: req.file });
  res.json({ success: true, data, url });
});

module.exports = { get, upsert, uploadPhoto };
