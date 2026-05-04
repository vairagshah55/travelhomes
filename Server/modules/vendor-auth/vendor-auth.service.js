/**
 * Vendor auth service — login, forgot-password OTP, password reset, and
 * account update flows for vendor (and user) Register documents.
 *
 * Preserves the legacy contract: `email` field accepts either an email or a
 * mobile number; OTP is delivered via email + SMS based on what the document
 * has on file.
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const Register = require("../../models/Register");
const Profile = require("../../models/Profile");
const Vendor = require("../../models/Vendor");
const { sendOtpEmail } = require("../../services/mailer");
const { twiliosms } = require("../../config/smstwrilio");
const { signInToken } = require("../../config/auth");
const logger = require("../../shared/logger");
const env = require("../../config/env");
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  AppError,
} = require("../../shared/errors");

const OTP_TTL_MS = 10 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

// Crypto-secure 6-digit OTP.
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

// Resolve a single `email` field that legacy clients pass as either an email
// or a mobile number. Returns a Mongoose-ready query fragment.
function resolveIdentifierQuery(input) {
  const value = String(input).trim();
  return value.includes("@") ? { email: value.toLowerCase() } : { mobile: value };
}

// ─── Login ──────────────────────────────────────────────────────────────────
async function login({ email, password, remember }) {
  const query = resolveIdentifierQuery(email);

  // Multiple Register rows can share the same email (different userType
  // historically). We try each candidate's password until one matches.
  const docs = await Register.find(query).select("+passwordHash");
  if (env.LOG_AUTH_DEBUG) {
    logger.debug({ identifier: email, count: docs.length }, "[VENDOR LOGIN] candidates");
  }
  if (docs.length === 0) {
    throw new UnauthorizedError("Invalid credentials");
  }

  let validDoc = null;
  for (const doc of docs) {
    if (!doc.passwordHash) continue;
    const isMatch = await bcrypt.compare(password, doc.passwordHash);
    if (isMatch) {
      validDoc = doc;
      break;
    }
  }
  if (!validDoc) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // If a pending OTP is on the doc, the user is mid-registration.
  if (validDoc.otp && validDoc.otpVerified === false) {
    throw new ForbiddenError("Please verify your OTP first");
  }

  const token = signInToken(
    {
      _id: validDoc._id,
      email: validDoc.email,
      name: validDoc.firstName || "",
      role: validDoc.userType || "vendor",
    },
    remember,
  );

  validDoc.lastLogin = new Date();
  await validDoc.save();

  const vendorDoc = await Vendor.findOne({ email: validDoc.email });

  return {
    token,
    user: {
      id: validDoc._id,
      email: validDoc.email,
      firstName: validDoc.firstName || "",
      lastName: validDoc.lastName || "",
      userType: validDoc.userType || "vendor",
      vendorStatus: vendorDoc?.status,
      state: validDoc.state,
      city: validDoc.city,
      mobile: validDoc.mobile,
    },
  };
}

// ─── Forgot password ────────────────────────────────────────────────────────
// Always returns success to avoid leaking which emails/mobiles exist.
async function forgotPassword({ email }) {
  const query = resolveIdentifierQuery(email);
  const doc = await Register.findOne(query);
  if (!doc) {
    return {
      message: "If the account exists, password reset instructions have been sent",
    };
  }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  doc.otp = otp;
  doc.otpExpiresAt = otpExpiresAt;
  doc.otpVerified = false;
  await doc.save();

  let sentCount = 0;
  const errors = [];

  if (doc.email) {
    try {
      await sendOtpEmail(doc.email, otp);
      sentCount++;
    } catch (err) {
      logger.error({ err: err.message, email: doc.email }, "forgot-password: email send failed");
      errors.push(`Email: ${err.message}`);
    }
  }
  if (doc.mobile) {
    try {
      await twiliosms(doc.mobile, `Your Travel Homes OTP code is: ${otp}. Valid for 10 minutes.`);
      sentCount++;
    } catch (err) {
      logger.error({ err: err.message, mobile: doc.mobile }, "forgot-password: SMS send failed");
      errors.push(`SMS: ${err.message}`);
    }
  }

  if (sentCount === 0) {
    throw new AppError(
      "OTP_DELIVERY_FAILED",
      500,
      "Failed to send reset code via Email or SMS",
      errors,
    );
  }

  const channels = [doc.email && "Email", doc.mobile && "Mobile"].filter(Boolean).join(" & ");
  return { message: `Password reset OTP sent to ${channels}` };
}

// ─── Verify forgot-password OTP ─────────────────────────────────────────────
async function verifyForgotOtp({ email, otp }) {
  const query = {
    ...resolveIdentifierQuery(email),
    otp: String(otp).trim(),
    otpExpiresAt: { $gt: new Date() },
  };
  const doc = await Register.findOne(query);
  if (!doc) {
    throw new BadRequestError("Invalid or expired OTP");
  }
  return { message: "OTP verified successfully" };
}

// ─── Reset password ─────────────────────────────────────────────────────────
async function resetPassword({ email, otp, newPassword: newPwd }) {
  const query = {
    ...resolveIdentifierQuery(email),
    otp: String(otp).trim(),
    otpExpiresAt: { $gt: new Date() },
  };
  // We update ALL records that match this email + OTP — handles legacy
  // duplicate-row cases where both vendor and user docs share the email.
  const docs = await Register.find(query);
  if (docs.length === 0) {
    throw new BadRequestError("Invalid or expired OTP");
  }

  const passwordHash = await bcrypt.hash(newPwd, BCRYPT_ROUNDS);
  for (const doc of docs) {
    doc.passwordHash = passwordHash;
    doc.otp = null;
    doc.otpExpiresAt = null;
    doc.otpVerified = false;
    await doc.save();
  }
  return { message: "Password reset successful" };
}

// ─── Update account ─────────────────────────────────────────────────────────
async function updateAccount({
  currentEmail,
  userType,
  email,
  mobile,
  currentPassword,
  newPassword: newPwd,
}) {
  // Locate the right Register row using a layered strategy:
  //  1. email + userType (most specific)
  //  2. email + currentPassword match (handles legacy duplicate emails)
  //  3. fallback to first match by email
  let doc = null;
  if (userType) {
    doc = await Register.findOne({ email: currentEmail, userType }).select("+passwordHash");
  }
  if (!doc && currentPassword) {
    const candidates = await Register.find({ email: currentEmail }).select("+passwordHash");
    for (const c of candidates) {
      if (c.passwordHash && (await bcrypt.compare(currentPassword, c.passwordHash))) {
        doc = c;
        break;
      }
    }
  }
  if (!doc) {
    doc = await Register.findOne({ email: currentEmail }).select("+passwordHash");
  }
  if (!doc) throw new NotFoundError("User");

  // Verify current password if a password change is requested OR if the
  // caller supplied one (defence-in-depth).
  if (currentPassword) {
    const isMatch = await bcrypt.compare(currentPassword, doc.passwordHash || "");
    if (!isMatch) throw new UnauthorizedError("Invalid current password");
  } else if (newPwd) {
    // The DTO already enforces this at validation time, but we double-check
    // here so the service is correct in isolation.
    throw new BadRequestError("Current password is required to update password");
  }

  // Email change: enforce uniqueness across all Register rows.
  if (email) {
    const lowerNewEmail = String(email).trim().toLowerCase();
    const existing = await Register.findOne({ email: lowerNewEmail });
    if (existing && String(existing._id) !== String(doc._id)) {
      throw new ConflictError("Email already in use");
    }
    doc.email = lowerNewEmail;
  }
  if (mobile) doc.mobile = mobile;
  if (newPwd) doc.passwordHash = await bcrypt.hash(newPwd, BCRYPT_ROUNDS);

  // Clear any pending OTPs so a stale OTP doesn't lock the user out next login.
  doc.otp = null;
  doc.otpExpiresAt = null;
  doc.otpVerified = false;
  await doc.save();

  // Mirror email/mobile changes into Profile.
  const profileUpdate = {};
  if (email) profileUpdate.email = doc.email;
  if (mobile) profileUpdate.phoneNumber = mobile;
  if (Object.keys(profileUpdate).length > 0) {
    await Profile.updateMany({ email: currentEmail }, { $set: profileUpdate });
  }

  // Mirror email change into Vendor (if this is a vendor or has no userType).
  if (email && (doc.userType === "vendor" || !doc.userType)) {
    await Vendor.updateMany({ email: currentEmail }, { $set: { email: doc.email } });
  }

  let vendorStatus;
  if (doc.userType === "vendor") {
    const v = await Vendor.findOne({ email: doc.email });
    vendorStatus = v?.status;
  }

  return {
    user: {
      id: doc._id,
      email: doc.email,
      firstName: doc.firstName || "",
      lastName: doc.lastName || "",
      mobile: doc.mobile || "",
      userType: doc.userType || "user",
      vendorStatus,
    },
  };
}

// ─── Send change-OTP (when user wants to change their email or mobile) ──────
async function sendChangeOtp({ currentEmail, userType, newEmail, newMobile }) {
  const query = { email: currentEmail };
  if (userType) query.userType = userType;

  const doc = await Register.findOne(query);
  if (!doc) throw new NotFoundError("User");

  if (newEmail) {
    const lowerNewEmail = String(newEmail).trim().toLowerCase();
    const existing = await Register.findOne({ email: lowerNewEmail });
    if (existing && String(existing._id) !== String(doc._id)) {
      throw new ConflictError("Email already in use");
    }
  }
  if (newMobile) {
    const existing = await Register.findOne({ mobile: newMobile });
    if (existing && String(existing._id) !== String(doc._id)) {
      throw new ConflictError("Mobile number already in use");
    }
  }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  doc.otp = otp;
  doc.otpExpiresAt = otpExpiresAt;
  doc.otpVerified = false;
  await doc.save();

  if (newEmail) {
    try {
      await sendOtpEmail(newEmail, otp);
    } catch (err) {
      logger.error({ err: err.message, newEmail }, "send-change-otp: email send failed");
      throw new AppError("OTP_DELIVERY_FAILED", 500, "Failed to send OTP to new email");
    }
  }
  if (newMobile) {
    try {
      await twiliosms(newMobile, `Your verification code is: ${otp}. Valid for 10 minutes.`);
    } catch (err) {
      logger.error({ err: err.message, newMobile }, "send-change-otp: SMS send failed");
      throw new AppError(
        "OTP_DELIVERY_FAILED",
        500,
        `Failed to send OTP to new mobile: ${err.message}`,
      );
    }
  }

  // Returning the OTP in dev mirrors the legacy behavior — useful for local
  // testing without SMTP/Twilio. Never returned in production.
  return env.NODE_ENV === "development" ? { otp } : {};
}

module.exports = {
  login,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  updateAccount,
  sendChangeOtp,
};
