const VendorSetting = require("../../models/VendorSetting");
const { NotFoundError, ConflictError } = require("../../shared/errors");

async function getByVendorId(vendorId) {
  const data = await VendorSetting.findOne({ vendorId });
  if (!data) throw new NotFoundError("Vendor settings");
  return { data };
}

async function create(input) {
  const exists = await VendorSetting.findOne({ vendorId: input.vendorId });
  if (exists) throw new ConflictError("Vendor settings already exist");
  const data = await VendorSetting.create(input);
  return { data };
}

async function upsert(vendorId, body) {
  const data = await VendorSetting.findOneAndUpdate(
    { vendorId },
    { $set: body },
    { new: true, upsert: true, runValidators: true },
  );
  return { data };
}

async function patchSection(vendorId, section, updates) {
  const update = {};
  for (const [key, value] of Object.entries(updates)) {
    update[`${section}.${key}`] = value;
  }
  const data = await VendorSetting.findOneAndUpdate(
    { vendorId },
    { $set: update },
    { new: true, upsert: true, runValidators: true },
  );
  return { data, section };
}

module.exports = { getByVendorId, create, upsert, patchSection };
