/**
 * Vendor-auth controller — thin wrappers around the service layer.
 * Each handler reads validated input from req.validated, calls the service,
 * shapes the HTTP response. No DB calls, no try/catch.
 */
const asyncHandler = require("../../shared/asyncHandler");
const service = require("./vendor-auth.service");

const login = asyncHandler(async (req, res) => {
  const { token, user } = await service.login(req.validated.body);
  res.json({ success: true, message: "Login successful", token, user });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { message } = await service.forgotPassword(req.validated.body);
  res.json({ success: true, message });
});

const verifyForgotOtp = asyncHandler(async (req, res) => {
  const { message } = await service.verifyForgotOtp(req.validated.body);
  res.json({ success: true, message });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { message } = await service.resetPassword(req.validated.body);
  res.json({ success: true, message });
});

const updateAccount = asyncHandler(async (req, res) => {
  const { user } = await service.updateAccount(req.validated.body);
  res.json({ success: true, message: "Account updated successfully", user });
});

const sendChangeOtp = asyncHandler(async (req, res) => {
  const result = await service.sendChangeOtp(req.validated.body);
  res.json({ success: true, message: "OTP sent successfully", ...result });
});

module.exports = {
  login,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  updateAccount,
  sendChangeOtp,
};
