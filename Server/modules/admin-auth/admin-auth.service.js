/**
 * Admin auth service — staff + superadmin login + getMe.
 *
 * Two login flows:
 *   - AdminStaff (primary): credentials live in the AdminStaff collection.
 *   - Superadmin (legacy):   credentials live in the Admin collection.
 *
 * Both mint the same JWT shape with the role baked into `type`/`role` so
 * downstream `requireJwt({ adminOnly: true })` can authorise either.
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AdminStaff = require("../../models/AdminStaff");
const Admin = require("../../models/AdminModel");
const { JWT_SECRET } = require("../../config/auth");
const env = require("../../config/env");
const { UnauthorizedError, ForbiddenError, NotFoundError } = require("../../shared/errors");

function signAdminToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

// ─── AdminStaff login (primary) ─────────────────────────────────────────────
async function loginStaff({ email, password }) {
  const staff = await AdminStaff.findOne({ email }).select("+passwordHash");
  if (!staff || !staff.passwordHash) {
    throw new UnauthorizedError("Incorrect email or password");
  }

  const isMatch = await bcrypt.compare(password, staff.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError("Incorrect email or password");
  }

  if (staff.status !== "Active") {
    throw new ForbiddenError("Account not active. Contact admin.");
  }

  // Best-effort lastLogin write — failing here shouldn't fail the login.
  AdminStaff.updateOne({ _id: staff._id }, { $set: { lastLogin: new Date() } }).catch(() => {});

  const token = signAdminToken({
    sub: staff._id,
    type: "admin",
    role: staff.role,
    email: staff.email,
    name: staff.name,
  });

  return {
    token,
    admin: {
      name: staff.name,
      email: staff.email,
      role: staff.role,
      status: staff.status,
      joinDate: staff.joinDate,
      lastLogin: staff.lastLogin,
    },
  };
}

// ─── Superadmin login (legacy Admin collection) ─────────────────────────────
async function loginSuperadmin({ email, password }) {
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new UnauthorizedError("Invalid username or password");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid username or password");
  }

  const token = signAdminToken({
    sub: admin._id,
    type: "superadmin",
    role: admin.role,
    email: admin.email,
  });

  return { token, admin: { token } };
}

// ─── getMe (used by /api/admin/auth/me) ─────────────────────────────────────
async function getMe(adminId) {
  const staff = await AdminStaff.findById(adminId);
  if (!staff) throw new NotFoundError("Admin");
  return {
    admin: {
      name: staff.name,
      email: staff.email,
      role: staff.role,
      status: staff.status,
      joinDate: staff.joinDate,
      lastLogin: staff.lastLogin,
    },
  };
}

module.exports = {
  loginStaff,
  loginSuperadmin,
  getMe,
};
