/**
 * Auth controller — registration sub-flow.
 *
 * Each handler:
 *   1. Reads validated input from req.validated (set by the validate middleware).
 *   2. Calls the service.
 *   3. Shapes the HTTP response.
 *
 * No DB calls, no business logic. Errors thrown by the service propagate
 * via asyncHandler → errorMiddleware.
 */
const asyncHandler = require("../../shared/asyncHandler");
const authService = require("./auth.service");

const register = asyncHandler(async (req, res) => {
  const { registerId, registered, created } = await authService.registerUser(req.validated.body);
  res.status(201).json({
    success: true,
    message: "Registration successful",
    registerId,
    registered,
    created,
  });
});

const updateRegisterDetails = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { updated } = await authService.updateRegisterDetails(id, req.validated.body);
  res.json({ success: true, updated });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { otp } = req.validated.body;
  const { doc, token } = await authService.verifyOtp(id, otp);
  res.json({ success: true, message: "OTP verified", doc, token });
});

const resendOtp = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { otpExpiresAt } = await authService.resendOtp(id);
  res.json({ success: true, message: "OTP resent.", otpExpiresAt });
});

const googleSignIn = asyncHandler(async (req, res) => {
  const { code } = req.validated.body;
  const { user, token } = await authService.googleSignIn(code);
  res.json({ success: true, message: "Google login successful", token, user });
});

module.exports = {
  register,
  updateRegisterDetails,
  verifyOtp,
  resendOtp,
  googleSignIn,
};
