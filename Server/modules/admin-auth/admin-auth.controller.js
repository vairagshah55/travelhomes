/**
 * Admin-auth controller — thin wrappers around the service layer.
 *
 * The legacy response shape preserves a few quirks for client compatibility:
 *   - loginStaff returns `{ success: true, token, admin: {...} }`
 *   - loginSuperadmin returns `{ status: "success", token, message, admin: { token } }`
 *   - getMe returns `{ success: true, admin: {...} }`
 *
 * Phase 4 will unify these once the clients are updated.
 */
const asyncHandler = require("../../shared/asyncHandler");
const { UnauthorizedError } = require("../../shared/errors");
const service = require("./admin-auth.service");

const loginStaff = asyncHandler(async (req, res) => {
  const { token, admin } = await service.loginStaff(req.validated.body);
  res.json({ success: true, token, admin });
});

const loginSuperadmin = asyncHandler(async (req, res) => {
  const { token, admin } = await service.loginSuperadmin(req.validated.body);
  res.status(200).json({
    status: "success",
    token,
    message: "You are signed in successfully!",
    admin,
  });
});

const getMe = asyncHandler(async (req, res) => {
  if (!req.user?.sub) {
    throw new UnauthorizedError("Admin authentication required");
  }
  const result = await service.getMe(req.user.sub);
  res.json({ success: true, ...result });
});

module.exports = {
  loginStaff,
  loginSuperadmin,
  getMe,
};
