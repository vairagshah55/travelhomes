const asyncHandler = require("../../shared/asyncHandler");
const service = require("./vendor-setting.service");

const get = asyncHandler(async (req, res) => {
  const { data } = await service.getByVendorId(req.validated.params.vendorId);
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const { data } = await service.create(req.validated.body);
  res.status(201).json({ success: true, data, message: "Vendor settings created successfully" });
});

const upsert = asyncHandler(async (req, res) => {
  const { data } = await service.upsert(req.validated.params.vendorId, req.validated.body);
  res.json({ success: true, data, message: "Vendor settings updated successfully" });
});

const patchSection = asyncHandler(async (req, res) => {
  const { data, section } = await service.patchSection(
    req.validated.params.vendorId,
    req.validated.params.section,
    req.validated.body,
  );
  res.json({ success: true, data, message: `${section} section updated successfully` });
});

module.exports = { get, create, upsert, patchSection };
