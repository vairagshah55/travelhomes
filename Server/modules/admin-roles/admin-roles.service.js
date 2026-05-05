const mongoose = require("mongoose");

const AdminRole = require("../../models/AdminRole");
const AdminStaff = require("../../models/AdminStaff");
const { NotFoundError, ConflictError } = require("../../shared/errors");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function list({
  search,
  isActive,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  const query = {};
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    query.$or = [{ name: re }, { description: re }];
  }
  if (isActive !== undefined) query.isActive = isActive;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [roles, total] = await Promise.all([
    AdminRole.find(query).populate("createdBy", "name email").sort(sort).skip(skip).limit(limit),
    AdminRole.countDocuments(query),
  ]);

  return { roles, totalItems: total, currentPage: page, itemsPerPage: limit };
}

async function getById(id) {
  const role = await AdminRole.findById(id).populate("createdBy", "name email");
  if (!role) throw new NotFoundError("Role", id);
  return { role };
}

async function create(input, user) {
  // Resolve createdBy: prefer the request body, else the authenticated user.
  let createdBy = input.createdBy;
  if (!createdBy && user) {
    createdBy = user.id || user._id;
  }
  if (createdBy && !mongoose.isValidObjectId(createdBy)) {
    // Drop invalid id rather than triggering a CastError downstream.
    createdBy = undefined;
  }

  const trimmed = input.name.trim();
  const exists = await AdminRole.findOne({ name: trimmed });
  if (exists) throw new ConflictError("Role already exists");

  const role = new AdminRole({
    name: trimmed,
    description: (input.description || "").trim(),
    features: Array.isArray(input.features) ? input.features : [],
    permissions: Array.isArray(input.permissions) ? input.permissions : [],
    isActive: input.isActive !== false,
    createdBy,
  });
  const saved = await role.save();
  if (saved.createdBy) {
    try {
      await saved.populate("createdBy", "name email");
    } catch {
      /* populate fails if the createdBy ref is stale — non-fatal */
    }
  }
  return { role: saved };
}

async function update(id, patch) {
  const role = await AdminRole.findById(id);
  if (!role) throw new NotFoundError("Role", id);

  if (patch.name && patch.name.trim() !== role.name) {
    const exists = await AdminRole.findOne({ name: patch.name.trim(), _id: { $ne: id } });
    if (exists) throw new ConflictError("Role name already in use");
    role.name = patch.name.trim();
  }
  if (patch.description !== undefined) role.description = (patch.description || "").trim();
  if (patch.isActive !== undefined) role.isActive = patch.isActive;
  if (patch.features) role.features = Array.isArray(patch.features) ? patch.features : [];
  if (patch.permissions)
    role.permissions = Array.isArray(patch.permissions) ? patch.permissions : [];

  const saved = await role.save();
  await saved.populate("createdBy", "name email");
  return { role: saved };
}

async function toggle(id) {
  const role = await AdminRole.findById(id);
  if (!role) throw new NotFoundError("Role", id);
  role.isActive = !role.isActive;
  const saved = await role.save();
  await saved.populate("createdBy", "name email");
  return { role: saved };
}

async function remove(id) {
  const role = await AdminRole.findById(id);
  if (!role) throw new NotFoundError("Role", id);

  const inUse = await AdminStaff.countDocuments({ roleId: id });
  if (inUse > 0) {
    throw new ConflictError("Role in use by staff. Unassign before deletion.");
  }
  await AdminRole.findByIdAndDelete(id);
  return { message: "Role deleted" };
}

function availableFeatures() {
  return { features: AdminRole.AVAILABLE_FEATURES || [] };
}

async function statsOverview() {
  const [totalRoles, activeRoles, inactiveRoles, roleUsage] = await Promise.all([
    AdminRole.countDocuments(),
    AdminRole.countDocuments({ isActive: true }),
    AdminRole.countDocuments({ isActive: false }),
    AdminStaff.aggregate([{ $group: { _id: "$roleId", count: { $sum: 1 } } }]),
  ]);
  return {
    summary: { totalRoles, activeRoles, inactiveRoles, roleUsage },
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  toggle,
  remove,
  availableFeatures,
  statsOverview,
};
