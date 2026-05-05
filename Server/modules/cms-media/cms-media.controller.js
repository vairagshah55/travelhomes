const asyncHandler = require("../../shared/asyncHandler");
const { BadRequestError } = require("../../shared/errors");
const service = require("./cms-media.service");

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.validated.query);
  res.json({ success: true, data });
});

const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new BadRequestError("No file uploaded");
  const data = await service.upsert(req.validated.body, req.file);
  res.status(201).json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  const data = await service.remove(req.validated.params.id);
  res.json({ success: true, message: "Deleted", data });
});

module.exports = { list, upload, remove };
