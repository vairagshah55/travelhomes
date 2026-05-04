/**
 * Vendor-auth router. Mounted at /api/vendorlogin from api/index.js.
 *
 * Layer order:  rate-limit -> validate -> controller (asyncHandler).
 */
const express = require("express");
const rateLimit = require("express-rate-limit");

const env = require("../../config/env");
const validate = require("../../shared/validate");
const controller = require("./vendor-auth.controller");
const dto = require("./vendor-auth.dto");

const router = express.Router();

// Per-IP brute-force protection on credential + OTP endpoints. Disabled in
// tests (rate-limiter behavior is its own concern).
const authLimiter =
  env.NODE_ENV === "test"
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please try again later.",
          },
        },
      });

const otpLimiter =
  env.NODE_ENV === "test"
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: 60 * 1000,
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

// POST /api/vendorlogin/login — vendor (or user) password login.
router.post("/login", authLimiter, validate({ body: dto.loginBody }), controller.login);

// POST /api/vendorlogin/forgot — issue a password-reset OTP.
router.post("/forgot", otpLimiter, validate({ body: dto.forgotBody }), controller.forgotPassword);

// POST /api/vendorlogin/verify-otp — confirm a forgot-password OTP.
router.post(
  "/verify-otp",
  authLimiter,
  validate({ body: dto.verifyOtpBody }),
  controller.verifyForgotOtp,
);

// POST /api/vendorlogin/reset — set a new password using a verified OTP.
router.post("/reset", authLimiter, validate({ body: dto.resetBody }), controller.resetPassword);

// POST /api/vendorlogin/update-account — change email / mobile / password.
router.post(
  "/update-account",
  authLimiter,
  validate({ body: dto.updateAccountBody }),
  controller.updateAccount,
);

// POST /api/vendorlogin/send-change-otp — issue an OTP to confirm a change.
router.post(
  "/send-change-otp",
  otpLimiter,
  validate({ body: dto.sendChangeOtpBody }),
  controller.sendChangeOtp,
);

module.exports = router;
