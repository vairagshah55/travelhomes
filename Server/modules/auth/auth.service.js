/**
 * Auth service — registration sub-flow.
 *
 * Pure business logic: takes plain-object inputs (already validated by the
 * route layer's zod DTO), performs DB work, returns plain data. Throws
 * AppError subclasses on domain failures so the central error middleware can
 * format the HTTP response.
 *
 * Controllers must never call Mongoose directly — every DB touch goes
 * through this layer.
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const User = require("../../models/User");
const Vendor = require("../../models/Vendor");
const Register = require("../../models/Register");
const Notification = require("../../models/Notification");
const { sendOtpEmail } = require("../../services/mailer");
const { signInToken } = require("../../config/auth");
const logger = require("../../shared/logger");
const env = require("../../config/env");
const { ConflictError, NotFoundError, BadRequestError, AppError } = require("../../shared/errors");

const OTP_TTL_MS = 5 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

// Cryptographically secure 6-digit OTP.
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const fullNameOf = (firstName, lastName) =>
  [firstName, lastName].filter(Boolean).join(" ").trim() || "New User";

const locationOf = ({ city, state, country }) =>
  [city, state, country].filter(Boolean).join(", ") || "N/A";

/**
 * Create or refresh a registration record and send an OTP via email.
 * Idempotent for the same email when the prior registration is unverified.
 *
 * @param {object} input — already validated by the registerBody DTO
 * @returns {Promise<{ registerId: string, registered: object, created: object }>}
 */
async function registerUser(input) {
  const {
    userType,
    firstName,
    lastName,
    email,
    mobile,
    dateOfBirth,
    country,
    state,
    city,
    password,
  } = input;

  // Block re-registration on a verified email; client should log in instead.
  const verifiedRegistration = await Register.findOne({ email, otpVerified: true });
  if (verifiedRegistration) {
    throw new ConflictError("Email already exists and is verified. Please log in.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Reuse the existing unverified row for this email so a retry doesn't pile
  // up duplicate records.
  let registered = await Register.findOne({ email });
  if (registered) {
    Object.assign(registered, {
      userType,
      firstName,
      lastName,
      mobile,
      dateOfBirth,
      country,
      state,
      city,
      passwordHash,
      otp,
      otpExpiresAt,
      otpVerified: false,
    });
    await registered.save();
  } else {
    registered = await Register.create({
      userType,
      firstName,
      lastName,
      email,
      mobile,
      dateOfBirth,
      country,
      state,
      city,
      passwordHash,
      otp,
      otpExpiresAt,
      otpVerified: false,
    });
  }

  // Email is best-effort: registration shouldn't fail because SMTP is down.
  // The client can request a resend.
  sendOtpEmail(email, otp).catch((err) => {
    logger.error({ err: err.message, email }, "[REGISTER] failed to send OTP email");
  });

  // Mirror into the admin-facing User/Vendor list. Status is "unverified"
  // until the OTP is verified.
  const fullName = fullNameOf(firstName, lastName);
  const location = locationOf({ city, state, country });
  let created;
  if (userType === "user") {
    created = await User.findOneAndUpdate(
      { email },
      {
        name: fullName,
        email,
        phone: mobile || "",
        location,
        status: "unverified-email",
      },
      { upsert: true, new: true },
    );
  } else {
    created = await Vendor.findOneAndUpdate(
      { email },
      {
        brandName: fullName,
        personName: fullName,
        email,
        phone: mobile || "",
        location,
        status: "pending",
      },
      { upsert: true, new: true },
    );
  }

  return { registerId: String(registered._id), registered, created };
}

/**
 * Patch a registration document and mirror name/phone changes into the
 * corresponding User or Vendor record.
 */
async function updateRegisterDetails(id, patch) {
  const update = {};
  for (const key of [
    "firstName",
    "lastName",
    "dateOfBirth",
    "country",
    "state",
    "city",
    "mobile",
  ]) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }

  const updated = await Register.findByIdAndUpdate(id, update, { new: true });
  if (!updated) {
    throw new NotFoundError("Registration", id);
  }

  const fullName = fullNameOf(updated.firstName, updated.lastName);
  const location = locationOf(updated);

  if (updated.userType === "user") {
    await User.findOneAndUpdate(
      { email: updated.email },
      { name: fullName, phone: updated.mobile || "", location },
    );
  } else {
    await Vendor.findOneAndUpdate(
      { email: updated.email },
      { brandName: fullName, personName: fullName, phone: updated.mobile || "", location },
    );
  }

  return { updated };
}

/**
 * Verify the 6-digit OTP, mark the registration as verified, flip the
 * User/Vendor status, mint a JWT, and emit an admin notification.
 *
 * Returns the registration document and a JWT — the client uses the JWT
 * directly to skip a follow-up login.
 */
async function verifyOtp(id, providedOtp) {
  const doc = await Register.findById(id);
  if (!doc) throw new NotFoundError("Registration", id);

  if (!doc.otp || !doc.otpExpiresAt) {
    throw new BadRequestError("OTP not initialized for this registration.");
  }
  if (doc.otpExpiresAt.getTime() < Date.now()) {
    throw new BadRequestError("OTP expired. Please request a new OTP.");
  }

  // Constant-time comparison would be better, but OTP length is fixed and
  // the rate limiter caps brute-force attempts at 5/min/IP.
  const stored = String(doc.otp).trim();
  const provided = String(providedOtp).trim();

  if (env.LOG_OTP_DEBUG) {
    logger.debug({ registerId: id, match: stored === provided }, "[VERIFY OTP DEBUG]");
  }

  if (stored !== provided) {
    throw new BadRequestError("Invalid OTP.");
  }

  doc.otpVerified = true;
  await doc.save();

  if (doc.userType === "user") {
    await User.findOneAndUpdate({ email: doc.email }, { status: "active" });
  } else {
    await Vendor.findOneAndUpdate({ email: doc.email }, { status: "active" });
  }

  const token = signInToken({
    _id: doc._id,
    email: doc.email,
    name: doc.firstName || "",
    role: doc.userType || "user",
  });

  // Notification is fire-and-forget — failure here shouldn't break the verify flow.
  Notification.create({
    type: doc.userType === "vendor" ? "vendor_registration" : "new_user",
    title: doc.userType === "vendor" ? "New Vendor Registration" : "New User Registration",
    message:
      doc.userType === "vendor"
        ? `New vendor ${doc.firstName || ""} ${doc.lastName || ""} registered.`
        : `New user ${doc.firstName || ""} ${doc.lastName || ""} registered.`,
    referenceId: doc._id,
    referenceModel: doc.userType === "vendor" ? "Vendor" : "User",
  }).catch((err) => logger.error({ err: err.message }, "failed to create signup notification"));

  return { doc, token };
}

/**
 * Issue a fresh OTP and email it. Always resets `otpVerified` to false so a
 * verified user can't be re-used to triggered a fresh OTP for someone else.
 */
async function resendOtp(id) {
  const doc = await Register.findById(id);
  if (!doc) throw new NotFoundError("Registration", id);

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  doc.otp = otp;
  doc.otpExpiresAt = otpExpiresAt;
  doc.otpVerified = false;
  await doc.save();

  sendOtpEmail(doc.email, otp).catch((err) => {
    logger.error({ err: err.message, email: doc.email }, "[RESEND OTP] failed to send OTP email");
  });

  if (env.LOG_OTP_DEBUG) {
    logger.debug({ email: doc.email, expiresAt: otpExpiresAt }, "[RESEND OTP]");
  }

  return { otpExpiresAt };
}

/**
 * Exchange a Google authorization code for a JWT.
 *
 * Flow:
 *   1. POST the code to Google's token endpoint to get an access_token.
 *   2. Fetch the Google profile (email, name, picture).
 *   3. Look up or create a User keyed by email.
 *   4. Mint a JWT and return the user (with vendor status if applicable).
 *
 * Failure modes:
 *   - Google config missing  → AppError CONFIG_MISSING (server is misconfigured)
 *   - Google rejects the code → BadRequestError (client supplied a bad code)
 *   - Network failures        → bubbles as 500 via the central error handler
 */
async function googleSignIn(code) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new AppError(
      "GOOGLE_OAUTH_NOT_CONFIGURED",
      503,
      "Google sign-in is not configured on the server.",
    );
  }

  let tokenResp;
  try {
    tokenResp = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: env.GOOGLE_REDIRECT_URI,
    });
  } catch (err) {
    // Google returns 400 with `invalid_grant` for stale or already-used codes.
    if (err.response?.status === 400) {
      throw new BadRequestError(
        err.response.data?.error_description || "Invalid Google authorization code.",
      );
    }
    throw err;
  }

  const accessToken = tokenResp.data?.access_token;
  if (!accessToken) {
    throw new BadRequestError("Google did not return an access token.");
  }

  const profileResp = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = profileResp.data;
  const email = String(profile.email || "").toLowerCase();
  if (!email) {
    throw new BadRequestError("Google profile did not include an email address.");
  }

  let user = await User.findOne({ email });
  if (!user) {
    // First-time Google sign-in: create a User. The dummy fields below match
    // the legacy behavior of Authcontroller.googleAuth — Phase 4 cleanup will
    // tighten the User schema so these placeholders aren't needed.
    const uid = Math.floor(1000000 + Math.random() * 9000000);
    user = await User.create({
      uid,
      email,
      name: profile.name,
      fullname: profile.name,
      username: `${email.split("@")[0]}${uid}`,
      mobile: `00000${uid}`.slice(-10),
      photo: profile.picture,
      isActive: true,
      userType: "user",
      location: "Not specified",
      status: "active",
    });
  }

  const token = signInToken(user);

  // Augment the response with vendor status if the email matches a vendor record.
  const vendorDoc = await Vendor.findOne({ email });
  const userObj = user.toObject ? user.toObject() : { ...user._doc };
  userObj.vendorStatus = vendorDoc?.status;

  return { user: userObj, token };
}

module.exports = {
  registerUser,
  updateRegisterDetails,
  verifyOtp,
  resendOtp,
  googleSignIn,
};
