/**
 * Zod schemas for the vendor-auth module.
 *
 * The login / forgot / verify-otp / reset endpoints accept either an email or
 * a mobile in the same `email` field — preserving the legacy contract clients
 * already rely on. We model that with a permissive `emailOrMobile` schema and
 * resolve it inside the service.
 */
const { z } = require("zod");

const emailOrMobile = z.string().trim().min(1, "Email or mobile is required").max(254);

const password = z.string().min(1, "Password is required").max(128);
const newPassword = z.string().min(8, "Password must be at least 8 characters").max(128);

const otp = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be 6 digits");

const mobileLoose = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s-]{6,19}$/, "Invalid mobile number");

const userType = z.enum(["user", "vendor"]).optional();

// ─── POST /api/vendorlogin/login ────────────────────────────────────────────
const loginBody = z.object({
  email: emailOrMobile,
  password,
  remember: z.boolean().optional(),
});

// ─── POST /api/vendorlogin/forgot ───────────────────────────────────────────
const forgotBody = z.object({ email: emailOrMobile });

// ─── POST /api/vendorlogin/verify-otp ───────────────────────────────────────
const verifyOtpBody = z.object({ email: emailOrMobile, otp });

// ─── POST /api/vendorlogin/reset ────────────────────────────────────────────
const resetBody = z.object({
  email: emailOrMobile,
  otp,
  newPassword,
});

// ─── POST /api/vendorlogin/update-account ───────────────────────────────────
const updateAccountBody = z
  .object({
    currentEmail: z
      .email()
      .trim()
      .max(254)
      .transform((s) => s.toLowerCase()),
    userType,
    email: z.email().trim().max(254).optional(),
    mobile: mobileLoose.optional(),
    currentPassword: password.optional(),
    newPassword: newPassword.optional(),
  })
  .refine((data) => !data.newPassword || !!data.currentPassword, {
    message: "Current password is required to update password",
    path: ["currentPassword"],
  });

// ─── POST /api/vendorlogin/send-change-otp ──────────────────────────────────
const sendChangeOtpBody = z
  .object({
    currentEmail: z
      .email()
      .trim()
      .max(254)
      .transform((s) => s.toLowerCase()),
    userType,
    newEmail: z.email().trim().max(254).optional(),
    newMobile: mobileLoose.optional(),
  })
  .refine((data) => !!data.newEmail || !!data.newMobile, {
    message: "New email or mobile is required",
    path: ["newEmail"],
  });

module.exports = {
  loginBody,
  forgotBody,
  verifyOtpBody,
  resetBody,
  updateAccountBody,
  sendChangeOtpBody,
};
