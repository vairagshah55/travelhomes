const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Register = require('../models/Register');
const Profile = require('../models/Profile');
const { sendOtpEmail } = require('../services/mailer');
const { twiliosms } = require('../config/smstwrilio');
const { signInToken } = require('../config/auth');

// POST /api/vendorlogin/login
const vendorLogin = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    const inputVal = String(email).trim();
    const isEmail = inputVal.includes('@');
    
    let query = {};
    if (isEmail) {
       query.email = inputVal.toLowerCase();
    } else {
       query.mobile = inputVal;
    }
    
    // Find user/vendor document(s) - handle potential multiple roles
    let docs = await Register.find(query).select('+passwordHash');
    
    console.log(`[LOGIN DEBUG] Attempting login for: ${inputVal}`);
    console.log(`[LOGIN DEBUG] Query used:`, query);
    console.log(`[LOGIN DEBUG] Found ${docs.length} records`);

    if (docs.length === 0) {
      if (process.env.LOG_AUTH_DEBUG === 'true') {
        console.log('[LOGIN] Not found record', { email: isEmail ? inputVal : undefined, mobile: !isEmail ? inputVal : undefined });
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Iterate to find a matching password
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
      if (process.env.LOG_AUTH_DEBUG === 'true') {
        console.log('[LOGIN] Password mismatch for all records');
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Use the valid doc
    let doc = validDoc;
    
    // Optional: enforce OTP verification before allowing login
    if (doc.otp && doc.otpVerified === false) {
      if (process.env.LOG_AUTH_DEBUG === 'true') {
        console.log('[LOGIN] OTP not verified', { email: doc.email });
      }
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your OTP first' 
      });
    }
    
    // Generate JWT token using shared config
    const token = signInToken({
      _id: doc._id,
      email: doc.email,
      name: doc.firstName || '',
      role: doc.role || 'vendor' // Note: Register model has 'userType', schema usually maps to role
    }, remember);
    
    // Update last login
    doc.lastLogin = new Date();
    await doc.save();
    
    // Fetch Vendor status
    const Vendor = require('../models/Vendor');
    const vendorDoc = await Vendor.findOne({ email: doc.email });

    // Return success response with correct format for frontend
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: doc._id,
        email: doc.email,
        firstName: doc.firstName || '',
        lastName: doc.lastName || '',
        userType: doc.userType || 'vendor',
        vendorStatus: vendorDoc?.status,
        state: doc.state,
        city: doc.city,
        mobile: doc.mobile
      }
    });
    
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// POST /api/vendorlogin/forgot
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email or Mobile is required' 
      });
    }
    
    const inputVal = String(email).trim();
    const isEmail = inputVal.includes('@');
    
    let query = {};
    if (isEmail) {
       query.email = inputVal.toLowerCase();
    } else {
       query.mobile = inputVal;
    }
    
    const doc = await Register.findOne(query);
    
    if (!doc) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        success: true, 
        message: 'If the account exists, password reset instructions have been sent' 
      });
    }
    
    // Generate OTP for password reset
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    doc.otp = otp;
    doc.otpExpiresAt = otpExpiresAt;
    doc.otpVerified = false;
    await doc.save();
    
    // Send OTP
    let sentCount = 0;
    const errors = [];

    // 1. Try sending via Email if available
    if (doc.email) {
      try {
        await sendOtpEmail(doc.email, otp);
        sentCount++;
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        errors.push(`Email: ${emailError.message}`);
      }
    }

    // 2. Try sending via SMS if available (and if user searched by mobile, or just always?)
    // Best practice: if user entered mobile, prioritize SMS. If user entered email, prioritize email.
    // But for redundancy, we can try both or fallbacks.
    
    // If user searched by mobile, ensure we try SMS
    // If doc has mobile, try SMS
    if (doc.mobile) {
      try {
         // Using default format for OTP message
         await twiliosms(doc.mobile, `Your Travel Homes OTP code is: ${otp}. Valid for 10 minutes.`);
         sentCount++;
      } catch (smsError) {
         console.error('Failed to send OTP SMS:', smsError);
         errors.push(`SMS: ${smsError.message}`);
      }
    }

    if (sentCount === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset code via Email or SMS',
        errors 
      });
    }
    
    res.json({ 
      success: true, 
      message: `Password reset OTP sent to ${doc.email ? 'Email' : ''} ${doc.email && doc.mobile ? '&' : ''} ${doc.mobile ? 'Mobile' : ''}` 
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// POST /api/vendorlogin/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email/Mobile and OTP are required' 
      });
    }
    
    const inputVal = String(email).trim();
    const isEmail = inputVal.includes('@');
    const otpVal = String(otp).trim();

    let query = {};
    if (isEmail) {
       query.email = inputVal.toLowerCase();
    } else {
       query.mobile = inputVal;
    }
    
    // Check if OTP matches and is not expired
    query.otp = otpVal;
    query.otpExpiresAt = { $gt: new Date() };

    const doc = await Register.findOne(query);

    if (!doc) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// POST /api/vendorlogin/reset
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    console.log('[RESET DEBUG] Request body:', { email, otp, newPassword: '***' });

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email/Mobile, OTP, and new password are required' 
      });
    }
    
    const inputVal = String(email).trim();
    const isEmail = inputVal.includes('@');
    const otpVal = String(otp).trim();

    let query = {};
    if (isEmail) {
       query.email = inputVal.toLowerCase();
    } else {
       query.mobile = inputVal;
    }
    
    // Add OTP check to query
    query.otp = otpVal;
    query.otpExpiresAt = { $gt: new Date() };

    console.log('[RESET DEBUG] Query:', query);

    // Find ALL documents that match (in case of duplicates)
    // We want to update password for ALL accounts linked to this email/otp
    const docs = await Register.find(query);
    
    console.log(`[RESET DEBUG] Found ${docs.length} matching documents`);

    if (docs.length === 0) {
      // Check if it's expired or just wrong OTP
      // Debug query without OTP
      const debugQuery = { ...query };
      delete debugQuery.otp;
      delete debugQuery.otpExpiresAt;
      const userExists = await Register.findOne(debugQuery);
      
      if (userExists) {
          console.log('[RESET DEBUG] User exists, but OTP mismatch or expired. Stored OTP:', userExists.otp, 'Expiry:', userExists.otpExpiresAt);
      } else {
          console.log('[RESET DEBUG] User does not exist at all');
      }

      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update ALL matching documents
    for (const doc of docs) {
        doc.passwordHash = passwordHash;
        doc.otp = null;
        doc.otpExpiresAt = null;
        doc.otpVerified = false;
        await doc.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Password reset successful' 
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// POST /api/vendorlogin/update-account
const updateAccount = async (req, res) => {
  try {
    const { currentEmail, userType, email, mobile, currentPassword, newPassword } = req.body;
    
    if (!currentEmail) {
      return res.status(400).json({ success: false, message: 'Current email is required' });
    }

    const lowerCurrentEmail = String(currentEmail).trim().toLowerCase();
    
    let doc = null;

    // Strategy 1: Find by email + userType (Best)
    if (userType) {
       doc = await Register.findOne({ email: lowerCurrentEmail, userType }).select('+passwordHash');
    }

    // Strategy 2: If we have currentPassword, try to find the account that matches it (handle duplicates)
    if (!doc && currentPassword) {
       const docs = await Register.find({ email: lowerCurrentEmail }).select('+passwordHash');
       for (const d of docs) {
          if (d.passwordHash) {
            const isMatch = await bcrypt.compare(currentPassword, d.passwordHash);
            if (isMatch) {
              doc = d;
              break;
            }
          }
       }
    }

    // Strategy 3: Fallback to first account with email
    if (!doc) {
       doc = await Register.findOne({ email: lowerCurrentEmail }).select('+passwordHash');
    }
    
    if (!doc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password if provided (required for password change)
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, doc.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid current password' });
      }
    } else if (newPassword) {
      // If they want to change password, they MUST provide current password
      return res.status(400).json({ success: false, message: 'Current password is required to update password' });
    }

    // Update fields
    if (email) {
      const lowerNewEmail = String(email).trim().toLowerCase();
      // Check if new email is already taken
      const existing = await Register.findOne({ email: lowerNewEmail });
      if (existing && String(existing._id) !== String(doc._id)) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      doc.email = lowerNewEmail;
    }
    
    if (mobile) doc.mobile = mobile;
    
    if (newPassword) {
      const saltRounds = 10;
      doc.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    }

    // Clear any pending OTPs to prevent lockout during login
    doc.otp = null;
    doc.otpExpiresAt = null;
    doc.otpVerified = false; // Reset to safe state (or true if you want to consider this a verification, but null otp is safer for login check)

    await doc.save();

    // Also update Profile model if it exists
    const profileUpdate = {};
    if (email) profileUpdate.email = String(email).trim().toLowerCase();
    if (mobile) profileUpdate.phoneNumber = mobile;
    
    if (Object.keys(profileUpdate).length > 0) {
      await Profile.updateMany({ email: lowerCurrentEmail }, { $set: profileUpdate });
    }
    
    // Also update Vendor model if it exists (for Vendors)
    if (email && (doc.userType === 'vendor' || !doc.userType)) { // Defaults to vendor often
        const Vendor = require('../models/Vendor');
        await Vendor.updateMany({ email: lowerCurrentEmail }, { $set: { email: String(email).trim().toLowerCase() } });
    }

    // Get updated vendor status if applicable
    let vendorStatus;
    if (doc.userType === 'vendor') {
         const Vendor = require('../models/Vendor');
         const v = await Vendor.findOne({ email: doc.email });
         if (v) vendorStatus = v.status;
    }

    res.json({
      success: true,
      message: 'Account updated successfully',
      user: {
        id: doc._id,
        email: doc.email,
        firstName: doc.firstName || '',
        lastName: doc.lastName || '',
        mobile: doc.mobile || '',
        userType: doc.userType || 'user',
        vendorStatus
      }
    });

  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/vendorlogin/send-change-otp
const sendChangeOtp = async (req, res) => {
  try {
    const { currentEmail, userType, newEmail, newMobile } = req.body;
    console.log('[sendChangeOtp] Request:', { currentEmail, userType, newEmail, newMobile });
    
    if (!currentEmail) {
      return res.status(400).json({ success: false, message: 'Current email is required' });
    }
    
    if (!newEmail && !newMobile) {
      return res.status(400).json({ success: false, message: 'New email or mobile is required' });
    }
    
    const lowerCurrentEmail = String(currentEmail).trim().toLowerCase();
    
    // Find user by current email and userType
    let query = { email: lowerCurrentEmail };
    if (userType) {
      query.userType = userType;
    }

    const doc = await Register.findOne(query);
    if (!doc) {
      console.log('[sendChangeOtp] User not found for:', query);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check uniqueness of new email/mobile
    if (newEmail) {
      const lowerNewEmail = String(newEmail).trim().toLowerCase();
      const existing = await Register.findOne({ email: lowerNewEmail });
      if (existing && String(existing._id) !== String(doc._id)) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }
    
    if (newMobile) {
      const existing = await Register.findOne({ mobile: newMobile });
      if (existing && String(existing._id) !== String(doc._id)) {
        return res.status(400).json({ success: false, message: 'Mobile number already in use' });
      }
    }
    
    // Generate OTP
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = "123456"; // Fixed OTP as requested
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    console.log('[sendChangeOtp] Generated OTP for user:', doc._id);

    doc.otp = otp;
    doc.otpExpiresAt = otpExpiresAt;
    doc.otpVerified = false;
    await doc.save();
    
    // Send OTP to NEW contact info
    if (newEmail) {
      try {
        console.log('[sendChangeOtp] Sending OTP to email:', newEmail);
        if (typeof sendOtpEmail !== 'function') {
           console.error('sendOtpEmail is not a function');
           // fallback or error?
        } else {
           await sendOtpEmail(newEmail, otp);
        }
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        return res.status(500).json({ success: false, message: 'Failed to send OTP to new email' });
      }
    }
    
    if (newMobile) {
      try {
        console.log('[sendChangeOtp] Sending OTP to mobile:', newMobile);
        if (typeof twiliosms !== 'function') {
           console.error('twiliosms is not a function');
           // Don't fail if sms is not configured but log it
        } else {
           await twiliosms(newMobile, `Your verification code is: ${otp}. Valid for 10 minutes.`);
        }
      } catch (smsError) {
        console.error('Failed to send OTP SMS:', smsError);
        // Don't fail completely if SMS fails in dev/test, but in prod we should return error
        // Or maybe return error but log it well
        return res.status(500).json({ success: false, message: 'Failed to send OTP to new mobile: ' + smsError.message });
      }
    }
    
    console.log('[sendChangeOtp] OTP sent successfully');
    res.json({ success: true, message: 'OTP sent successfully', otp: process.env.NODE_ENV === 'development' ? otp : undefined });
    
  } catch (error) {
    console.error('Send change OTP error:', error);
    res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
  }
};

module.exports = {
  vendorLogin,
  forgotPassword,
  verifyOtp,
  resetPassword,
  updateAccount,
  sendChangeOtp
};
