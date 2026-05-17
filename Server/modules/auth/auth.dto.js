/**
 * Zod schemas for the auth module's registration sub-flow.
 * Used by the validate middleware in auth.router.js. Parsed values land on
 * req.validated.{body,params,query} — controllers never touch req.body raw.
 */
const { z } = require("zod");

// MongoDB ObjectId, 24 hex chars.
const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

// Common pieces — reused across DTOs.
const email = z
  .email()
  .trim()
  .max(254)
  .transform((s) => s.toLowerCase());

// Password: min 8, must contain at least one uppercase, lowercase, digit, and special char.
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
    "Password must include uppercase, lowercase, number and special symbol",
  );

const mobile = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s-]{6,19}$/, "Invalid mobile number");

const userType = z.enum(["user", "vendor"]);

// Date-of-birth: ISO datetime, ISO date (YYYY-MM-DD), or empty string.
// When provided, the user must be at least 18 years old.
const isAtLeast18 = (value) => {
  if (!value) return true; // optional / empty handled elsewhere
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 18;
};

const dateOfBirth = z
  .union([z.iso.datetime(), z.iso.date(), z.literal("")])
  .optional()
  .refine(isAtLeast18, { message: "You must be at least 18 years old" });

// ─── POST /api/auth/register ─────────────────────────────────────────────────
const registerBody = z
  .object({
    userType,
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    email,
    mobile: mobile.optional(),
    dateOfBirth,
    country: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    password,
  })
  // Users must provide a mobile number; vendors don't have to.
  .refine((data) => data.userType !== "user" || !!data.mobile, {
    message: "Mobile number is required for user registration",
    path: ["mobile"],
  });

// ─── PATCH /api/auth/register/:id ────────────────────────────────────────────
const updateRegisterParams = z.object({ id: objectIdString });

const updateRegisterBody = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    dateOfBirth,
    country: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    mobile: mobile.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// ─── POST /api/auth/register/:id/verify-otp ──────────────────────────────────
const verifyOtpParams = z.object({ id: objectIdString });
const verifyOtpBody = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

// ─── POST /api/auth/register/:id/resend-otp ──────────────────────────────────
const resendOtpParams = z.object({ id: objectIdString });

// ─── POST /api/auth/google ───────────────────────────────────────────────────
// SPA exchanges an authorization code for a JWT.
const googleSignInBody = z.object({
  code: z.string().min(1, "Authorization code is required"),
});

module.exports = {
  registerBody,
  updateRegisterParams,
  updateRegisterBody,
  verifyOtpParams,
  verifyOtpBody,
  resendOtpParams,
  googleSignInBody,
};
