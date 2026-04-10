const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Register = require('../models/Register');
const Notification = require('../models/Notification');
const { sendOtpEmail } = require('../services/mailer');
const { signInToken } = require('../config/auth');

/**
 * POST /api/auth/register
 * Accepts common registration payload including userType ("user" | "vendor")
 * 1) Always stores the raw registration in `register` collection (MongoDB)
 * 2) Additionally creates simplified User/Vendor records (or mock) for admin views
 */
const registerUserOrVendor = async (req, res) => {
  try {
    const {
      userType, // 'user' | 'vendor'
      firstName,
      lastName,
      email,
      mobile,
      dateOfBirth,
      country,
      state,
      city,
      password,
    } = req.body || {};

    if (!userType || !['user', 'vendor'].includes(userType)) {
      return res.status(400).json({ success: false, message: "Invalid or missing userType." });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }
    if (userType === 'user' && !mobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required for user registration." });
    }

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'New User';
    const location = [city, state, country].filter(Boolean).join(', ');

    // 1) Persist raw registration in `register` collection
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP and store with expiry (5 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if email already exists and is verified in any registration type
    let verifiedRegistration = await Register.findOne({ email: normalizedEmail, otpVerified: true });

    if (verifiedRegistration) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already exists and is verified. Please log in." 
      });
    }

    let registered;
    // Find any existing unverified registration for this email to reuse
    registered = await Register.findOne({ email: normalizedEmail });

    if (registered) {
      Object.assign(registered, {
        userType, firstName, lastName, mobile, dateOfBirth, country, state, city, passwordHash, otp, otpExpiresAt, otpVerified: false
      });
      await registered.save();
    } else {
      registered = await Register.create({
        userType, firstName, lastName, email: normalizedEmail, mobile, dateOfBirth, country, state, city, passwordHash, otp, otpExpiresAt, otpVerified: false
      });
    }

    // Send OTP email
    await sendOtpEmail(normalizedEmail, otp).catch((err) => {
      console.error('[REGISTER] Error sending OTP email:', err.message);
    });

    // 2) Create or update simplified User/Vendor entity for admin lists
    let created = null;
    if (userType === 'user') {
      const payload = {
        name: fullName || 'New User',
        email: normalizedEmail,
        phone: mobile || '',
        location: location || 'N/A',
        status: 'unverified-email',
      };
      created = await User.findOneAndUpdate({ email: normalizedEmail }, payload, { upsert: true, new: true });
    } else {
      const payload = {
        brandName: fullName || 'New Vendor',
        personName: fullName,
        email: normalizedEmail,
        phone: mobile || '',
        location: location || 'N/A',
        status: 'pending',
      };
      created = await Vendor.findOneAndUpdate({ email: normalizedEmail }, payload, { upsert: true, new: true });
    }

    return res.status(201).json({ success: true, message: 'Registration successful', registered, created, registerId: registered._id, otp }); // Sending OTP in response for testing/dev if needed, but usually it's in email
  } catch (error) {
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    // Handle duplicate key errors (e.g., unique email)
    if (error?.code === 11000) {
      const field = Object.keys(error?.keyPattern || {})[0] || 'field';
      return res.status(409).json({ success: false, message: `Duplicate value for ${field}` });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/auth/register/:id
 * Update register doc with final details from step 3
 */
const updateRegisterDetails = async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL parameters
    if (!id) return res.status(400).json({ success: false, message: "Missing register id." });

    const { firstName, lastName, dateOfBirth, country, state, city, mobile } = req.body || {};
    const update = {};
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth;
    if (country !== undefined) update.country = country;
    if (state !== undefined) update.state = state;
    if (city !== undefined) update.city = city;
    if (mobile !== undefined) update.mobile = mobile;

    let updated = await Register.findByIdAndUpdate(id, update, { new: true });
    
    if (!updated)
      return res.status(404).json({ success: false, message: "Registration not found" });

    // Sync with User or Vendor collection
    const fullName = [updated.firstName, updated.lastName].filter(Boolean).join(' ').trim();
    const location = [updated.city, updated.state, updated.country].filter(Boolean).join(', ');

    if (updated.userType === 'user') {
      const userPayload = {
        name: fullName || 'New User',
        phone: updated.mobile || '',
        location: location || 'N/A',
      };
      await User.findOneAndUpdate({ email: updated.email }, userPayload);
    } else {
      const vendorPayload = {
        brandName: fullName || 'New Vendor',
        personName: fullName,
        phone: updated.mobile || '',
        location: location || 'N/A',
      };
      await Vendor.findOneAndUpdate({ email: updated.email }, vendorPayload);
    }

    return res.json({ success: true, updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/auth/register/:id/verify-otp
 * Verify the OTP for a registration
 */
const verifyRegisterOtp = async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL parameters
    const { otp } = req.body || {}; // Get OTP from body

    if (!id || !otp)
      return res.status(400).json({ success: false, message: "Missing id or otp." });

    let doc = await Register.findById(id);
    
    if (!doc)
      return res.status(404).json({ success: false, message: "Registration not found" });

    if (!doc.otp || !doc.otpExpiresAt) {
      return res.status(400).json({ success: false, message: "OTP not initialized." });
    }

    if (doc.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
    }

    // Normalize both OTPs by trimming whitespace and converting to string
    const storedOtp = String(doc.otp).trim();
    const providedOtp = String(otp).trim();

    // Debug logging when explicitly enabled
    if (process.env.LOG_OTP_DEBUG === 'true') {
      console.log(`[VERIFY OTP DEBUG] registerId=${id} storedOtp="${storedOtp}" providedOtp="${providedOtp}" match=${storedOtp === providedOtp}`);
    }

    if (storedOtp !== providedOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    doc.otpVerified = true;
    await doc.save();

    // Update status in User or Vendor collection
    if (doc.userType === 'user') {
      await User.findOneAndUpdate({ email: doc.email }, { status: 'active' });
    } else {
      await Vendor.findOneAndUpdate({ email: doc.email }, { status: 'active' });
    }

    const token = signInToken({
      _id: doc._id,
      email: doc.email,
      name: doc.firstName || '',
      role: doc.userType || 'user'
    });

    // Create Notification for Admin
    try {
      await Notification.create({
        type: doc.userType === 'vendor' ? 'vendor_registration' : 'new_user',
        title: doc.userType === 'vendor' ? 'New Vendor Registration' : 'New User Registration',
        message: doc.userType === 'vendor' 
          ? `New vendor ${doc.firstName} ${doc.lastName} registered.` 
          : `New user ${doc.firstName} ${doc.lastName} registered.`,
        referenceId: doc._id,
        referenceModel: doc.userType === 'vendor' ? 'Vendor' : 'User'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    return res.json({ success: true, message: "OTP verified", doc, token });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/auth/register/:id/resend-otp
 * Resend a new OTP for a registration document
 */
const resendRegisterOtp = async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL parameters
    if (!id)
      return res.status(400).json({ success: false, message: "Missing register id." });

    let doc = await Register.findById(id);
    
    if (!doc)
      return res.status(404).json({ success: false, message: "Registration not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    doc.otp = otp;
    doc.otpExpiresAt = otpExpiresAt;
    doc.otpVerified = false;
    await doc.save();

    // Send OTP email on resend
    await sendOtpEmail(doc.email, otp).catch((err) => {
      console.error('[RESEND OTP] Error sending OTP email:', err.message);
    });

    if (process.env.LOG_OTP_DEBUG === 'true') {
      console.log(`[RESEND OTP] email=${doc.email} otp=${otp} (type: ${typeof otp}) expiresAt=${otpExpiresAt.toISOString()}`);
    }

    return res.json({ success: true, message: "OTP resent.", otpExpiresAt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUserOrVendor,
  updateRegisterDetails,
  verifyRegisterOtp,
  resendRegisterOtp
};
