/**
 * Auth router — registration sub-flow.
 * Mounted at /api/auth from api/index.js.
 *
 * Layer order: rate-limit → validate → controller. The controller is wrapped
 * in asyncHandler so any thrown AppError lands on errorMiddleware.
 */
const express = require("express");
const rateLimit = require("express-rate-limit");

const env = require("../../config/env");
const validate = require("../../shared/validate");
const controller = require("./auth.controller");
const dto = require("./auth.dto");

const router = express.Router();

// Per-IP brute-force protection on OTP issuance/verification.
// Disabled under NODE_ENV=test so integration tests aren't gated by it
// (rate-limiter behavior is its own concern with its own tests).
const otpLimiter =
  env.NODE_ENV === "test"
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many OTP requests. Please slow down.",
          },
        },
      });

// POST /api/auth/register — create or refresh a registration + email an OTP.
router.post("/register", otpLimiter, validate({ body: dto.registerBody }), controller.register);

// PATCH /api/auth/register/:id — update remaining details after OTP verify.
// Rate-limited to prevent abuse of the post-OTP update window.
router.patch(
  "/register/:id",
  otpLimiter,
  validate({ params: dto.updateRegisterParams, body: dto.updateRegisterBody }),
  controller.updateRegisterDetails,
);

// POST /api/auth/register/:id/verify-otp — verify a 6-digit OTP, mint a JWT.
router.post(
  "/register/:id/verify-otp",
  otpLimiter,
  validate({ params: dto.verifyOtpParams, body: dto.verifyOtpBody }),
  controller.verifyOtp,
);

// POST /api/auth/register/:id/resend-otp — issue a new OTP and email it.
router.post(
  "/register/:id/resend-otp",
  otpLimiter,
  validate({ params: dto.resendOtpParams }),
  controller.resendOtp,
);

// POST /api/auth/google — SPA exchanges a Google authorization code for a JWT.
// (The browser-redirect Google OAuth flow lives in routes/googleAuth.js — that
// passport flow is independent and pending its own migration.)
router.post("/google", validate({ body: dto.googleSignInBody }), controller.googleSignIn);

module.exports = router;
