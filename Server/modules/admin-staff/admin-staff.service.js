/**
 * Admin staff service.
 *
 * Staff records carry a role-NAME string AND a roleId reference. The
 * service resolves the roleId from AdminRole on create/update so the two
 * stay in sync.
 */
const bcrypt = require("bcryptjs");

const AdminStaff = require("../../models/AdminStaff");
const AdminRole = require("../../models/AdminRole");
const { NotFoundError, ConflictError } = require("../../shared/errors");

const BCRYPT_ROUNDS = 10;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function list({
  search,
  status,
  role,
  department,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  const query = {};
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    query.$or = [{ name: re }, { email: re }, { role: re }, { department: re }];
  }
  if (status) query.status = status;
  if (role) query.role = new RegExp(escapeRegex(role), "i");
  if (department) query.department = new RegExp(escapeRegex(department), "i");

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [staff, total] = await Promise.all([
    AdminStaff.find(query)
      .populate("roleId", "name features permissions")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    AdminStaff.countDocuments(query),
  ]);

  return {
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page * limit < total,
    staff,
  };
}

async function getById(id) {
  const staff = await AdminStaff.findById(id).populate("roleId", "name features permissions");
  if (!staff) throw new NotFoundError("Staff", id);
  return { staff };
}

async function create(input) {
  const exists = await AdminStaff.findOne({ email: input.email });
  if (exists) throw new ConflictError("Staff already exists");

  const roleDoc = await AdminRole.findOne({ name: input.role });
  const passwordHash = await bcrypt.hash(input.password || "Password@123", BCRYPT_ROUNDS);

  const doc = new AdminStaff({
    firstName: input.firstName,
    lastName: input.lastName,
    name: `${input.firstName} ${input.lastName}`,
    email: input.email,
    phone: input.phone,
    role: input.role,
    roleId: roleDoc?._id,
    status: input.status || "Active",
    department: input.department,
    salary: input.salary,
    address: input.address,
    emergencyContact: input.emergencyContact,
    avatar: input.avatar,
    joinDate: new Date(),
    passwordHash,
  });

  const saved = await doc.save();
  await saved.populate("roleId", "name features permissions");
  return { staff: saved };
}

async function update(id, patch) {
  const staff = await AdminStaff.findById(id);
  if (!staff) throw new NotFoundError("Staff", id);

  if (patch.email && patch.email !== staff.email) {
    const exists = await AdminStaff.findOne({ email: patch.email, _id: { $ne: id } });
    if (exists) throw new ConflictError("Email already exists");
  }

  if (patch.role && patch.role !== staff.role) {
    const r = await AdminRole.findOne({ name: patch.role });
    if (r) staff.roleId = r._id;
  }

  if (patch.firstName !== undefined) staff.firstName = patch.firstName;
  if (patch.lastName !== undefined) staff.lastName = patch.lastName;
  if (patch.firstName || patch.lastName) {
    staff.name = `${patch.firstName || staff.firstName} ${patch.lastName || staff.lastName}`;
  }
  if (patch.email) staff.email = patch.email;
  if (patch.phone) staff.phone = patch.phone;
  if (patch.role) staff.role = patch.role;
  if (patch.status) staff.status = patch.status;
  if (patch.department !== undefined) staff.department = patch.department;
  if (patch.salary !== undefined) staff.salary = patch.salary;
  if (patch.address) staff.address = { ...staff.address, ...patch.address };
  if (patch.emergencyContact)
    staff.emergencyContact = { ...staff.emergencyContact, ...patch.emergencyContact };
  if (patch.avatar !== undefined) staff.avatar = patch.avatar;
  if (patch.password) staff.passwordHash = await bcrypt.hash(patch.password, BCRYPT_ROUNDS);

  const saved = await staff.save();
  await saved.populate("roleId", "name features permissions");
  return { staff: saved };
}

async function toggleStatus(id) {
  const staff = await AdminStaff.findById(id);
  if (!staff) throw new NotFoundError("Staff", id);
  staff.status = staff.status === "Active" ? "Inactive" : "Active";
  const saved = await staff.save();
  await saved.populate("roleId", "name features permissions");
  return { data: saved };
}

async function touchLastLogin(id) {
  const staff = await AdminStaff.findById(id);
  if (!staff) throw new NotFoundError("Staff", id);
  staff.lastLogin = new Date();
  const saved = await staff.save();
  return { staff: saved };
}

async function remove(id) {
  const staff = await AdminStaff.findById(id);
  if (!staff) throw new NotFoundError("Staff", id);
  await AdminStaff.findByIdAndDelete(id);
  return { message: "Staff deleted" };
}

async function bulkStatus({ staffIds, status }) {
  const result = await AdminStaff.updateMany({ _id: { $in: staffIds } }, { $set: { status } });
  return { updatedCount: result.modifiedCount };
}

async function statsOverview() {
  const [totalStaff, activeStaff, inactiveStaff, staffByRole, staffByDepartment] =
    await Promise.all([
      AdminStaff.countDocuments(),
      AdminStaff.countDocuments({ status: "Active" }),
      AdminStaff.countDocuments({ status: "Inactive" }),
      AdminStaff.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      AdminStaff.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]),
    ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentJoiners = await AdminStaff.countDocuments({
    joinDate: { $gte: thirtyDaysAgo },
  });

  return {
    totalStaff,
    activeStaff,
    inactiveStaff,
    staffByRole,
    staffByDepartment,
    recentJoiners,
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  toggleStatus,
  touchLastLogin,
  remove,
  bulkStatus,
  statsOverview,
};
