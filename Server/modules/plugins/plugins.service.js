const Plugin = require("../../models/Plugin");
const { NotFoundError, ConflictError } = require("../../shared/errors");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function list({ q } = {}) {
  const filter = q ? { vendorName: { $regex: escapeRegex(q), $options: "i" } } : {};
  const data = await Plugin.find(filter).sort({ createdAt: -1 });
  return { data };
}

async function getById(id) {
  const data = await Plugin.findById(id);
  if (!data) throw new NotFoundError("Plugin", id);
  return { data };
}

async function create(input) {
  const trimmed = input.vendorName.trim();
  const exists = await Plugin.findOne({ vendorName: trimmed });
  if (exists) throw new ConflictError("Plugin with this vendor name already exists");

  const data = await Plugin.create({
    vendorName: trimmed,
    enabled: !!input.enabled,
    description: input.description?.trim() || "",
    licenseKey: input.licenseKey?.trim() || "",
  });
  return { data };
}

async function update(id, patch) {
  const plugin = await Plugin.findById(id);
  if (!plugin) throw new NotFoundError("Plugin", id);

  if (patch.vendorName && patch.vendorName.trim() !== plugin.vendorName) {
    const trimmed = patch.vendorName.trim();
    const exists = await Plugin.findOne({ vendorName: trimmed, _id: { $ne: id } });
    if (exists) throw new ConflictError("Plugin with this vendor name already exists");
    plugin.vendorName = trimmed;
  }
  if (patch.enabled !== undefined) plugin.enabled = !!patch.enabled;
  if (patch.description !== undefined) plugin.description = patch.description?.trim() || "";
  if (patch.licenseKey !== undefined) plugin.licenseKey = patch.licenseKey?.trim() || "";

  const data = await plugin.save();
  return { data };
}

async function toggle(id) {
  const plugin = await Plugin.findById(id);
  if (!plugin) throw new NotFoundError("Plugin", id);
  plugin.enabled = !plugin.enabled;
  const data = await plugin.save();
  return { data };
}

async function setLicense(id, licenseKey) {
  const plugin = await Plugin.findById(id);
  if (!plugin) throw new NotFoundError("Plugin", id);
  plugin.licenseKey = (licenseKey || "").trim();
  const data = await plugin.save();
  return { data };
}

async function remove(id) {
  const deleted = await Plugin.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundError("Plugin", id);
  return { message: "Plugin deleted successfully" };
}

module.exports = { list, getById, create, update, toggle, setLicense, remove };
