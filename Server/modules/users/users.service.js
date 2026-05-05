const User = require("../../models/User");
const { NotFoundError } = require("../../shared/errors");

// Map the SPA-side status filter aliases to the actual status values stored
// on the User document. "all-users" returns the un-filtered list.
const STATUS_ALIAS = {
  "all-users": null,
  "active-users": "active",
  "inactive-users": "inactive",
  "banned-users": "banned",
  "unverified-email": "unverified-email",
  "unverified-mobile": "unverified-mobile",
  subscribers: "subscriber",
};

async function list({ status } = {}) {
  let query = { role: { $ne: "vendor" } };
  if (status && status !== "all-users") {
    const mapped = STATUS_ALIAS[status];
    if (mapped) query = { status: mapped };
  }
  const data = await User.find(query).sort({ createdAt: -1 });
  return { data };
}

async function getById(id) {
  const data = await User.findById(id);
  if (!data) throw new NotFoundError("User", id);
  return { data };
}

async function create(input) {
  const data = await User.create(input);
  return { data };
}

async function update(id, patch) {
  const data = await User.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!data) throw new NotFoundError("User", id);
  return { data };
}

async function remove(id) {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User", id);
  await user.deleteOne();
  return { message: "User deleted successfully" };
}

module.exports = { list, getById, create, update, remove };
