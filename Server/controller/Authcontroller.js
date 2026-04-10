const Otp = require("../models/otpModel");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Admin = require("../models/AdminModel");
const auth = require("../config/auth");
const axios = require("axios");
const { twiliosms, smsStatus } = require('../config/smstwrilio');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require("dotenv").config();

const sendOtpToMobile = async (mobile) => {
  const otp = Math.floor(100000 + Math.random() * 900000); 
  console.log(`Sending OTP ${otp} to mobile ${mobile}`);
  return otp;
};

const withMobile = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ 
        "status": "error", 
        "message": "Invalid mobile number" 
      });
    }
    const otp = await sendOtpToMobile(mobile);
    await Otp.deleteMany({ mobile });

    const otpDoc = new Otp({
      mobile,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) 
    });

    await twiliosms(`+91${mobile}`, `Your OTP is ${otp}`);
    if (smsStatus.send) {
      await otpDoc.save();
      return res.status(200).json({
        status: "success",
        message: "OTP sent successfully"
      });
    } else {
      return res.status(500).json({
        status: "error",
        message: "Failed to send OTP"
      });
    }
  } catch (error) {
    console.error('Error in withMobile:', error);
    return res.status(500).json({ 
      "status": "error", 
      "message": "Internal server error" 
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ 
        "status": "error", 
        "message": "Mobile and OTP are required" 
      });
    }
    const otpDoc = await Otp.findOne({ mobile, otp });
    if (!otpDoc) {
      return res.status(400).json({ 
        "status": "error", 
        "message": "Invalid OTP" 
      });
    }

    const users = await User.findOne({ mobile });
    if (users) {
      return res.status(401).json({
        status: "error",
        message: "User already exists"
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ 
        "status": "error", 
        "message": "OTP expired" 
      });
    }
    const uid = Math.floor(1000000 + Math.random() * 9000000);
    const email = Math.floor(1000000 + Math.random() * 9000000);
    const user = new User({
      uid,
      mobile,
      email: `${email}@temp.com`
    });
    await user.save();
    await Otp.deleteOne({ _id: otpDoc._id }); 
    return res.status(200).json({ 
      "status": "success", 
      "message": "OTP verified successfully",
      "user": user
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(500).json({ 
      "status": "error", 
      "message": "Internal server error" 
    });
  }
};

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const withEmail = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ 
        "status": "error", 
        "message": "Invalid email address" 
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to Our App!',
      html: `<h3>Hello!</h3><p>Your email <b>${email}</b> was successfully registered</p>`
    };

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found"
      });
    }

    await transporter.sendMail(mailOptions);

    await User.updateOne(
      { mobile },
      { $set: { email } }
    );

    return res.status(200).json({
      status: "success",
      message: "Email updated successfully"
    });
  } catch (error) {
    console.error('Error in withEmail:', error);
    return res.status(500).json({ 
      "status": "error", 
      "message": "Internal server error" 
    });
  }
};

const signUp = async (req, res) => {
  try {
    const { fullname, username, password, mobile } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.updateOne(
      { mobile },
      {
        $set: {
          fullname,
          username,
          password: hashedPassword
        }
      }
    );

    return res.status(200).json({
      status: "success",
      message: "User registered successfully"
    });
  } catch (error) {
    console.error('Error in signUp:', error);
    return res.status(500).json({ 
      "status": "error", 
      "message": "Internal server error" 
    });
  }
};

const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials"
      });
    }

    const token = auth.signInToken(user);

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    console.error('Error in signIn:', error);
    return res.status(500).json({ 
      "status": "error", 
      "message": "Internal server error" 
    });
  }
};

const deleteusers = async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.status(200).json({ 
      message: "All users deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      "status": "error", 
      "message": "Failed to delete users" 
    });
  }
};

const deleteadmins = async (req, res) => {
  try {
    const result = await Admin.deleteMany({});
    res.status(200).json({ 
      message: "All admins deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      "status": "error", 
      "message": "Failed to delete admins" 
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Invalid admin credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid admin credentials"
      });
    }

    const token = auth.signInToken(admin);

    return res.status(200).json({
      status: "success",
      message: "Admin login successful",
      token,
      admin
    });
  } catch (error) {
    console.error('Error in adminLogin:', error);
    return res.status(500).json({ 
      "status": "error", 
      "message": "Internal server error" 
    });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for tokens
    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
    });

    const { access_token } = data;

    // Get user info
    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    let user = await User.findOne({ email: profile.email });

    if (!user) {
      // Register new user
      const uid = Math.floor(1000000 + Math.random() * 9000000);
      user = new User({
        uid,
        email: profile.email,
        name: profile.name,
        fullname: profile.name,
        username: profile.email.split('@')[0] + uid,
        mobile: `00000${uid}`.slice(-10), // Dummy unique mobile
        photo: profile.picture,
        isActive: true,
        userType: 'user',
        location: 'Not specified'
      });
      // Handle different schema requirements
      if (user.name === undefined) user.name = profile.name;
      if (user.location === undefined) user.location = 'Unknown';
      if (user.status === undefined) user.status = 'active';
      
      await user.save();
    }

    const token = auth.signInToken(user);

    // Look up vendor status
    const vendorDoc = await Vendor.findOne({ email: profile.email });
    const userObj = user.toObject ? user.toObject() : { ...user._doc };
    userObj.vendorStatus = vendorDoc?.status;

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: userObj
    });
    
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('Google Auth Error:', errorDetails);
    return res.status(500).json({
      success: false,
      message: "Google login failed",
      error: errorDetails
    });
  }
};

module.exports = { 
  withMobile,
  verifyOtp,
  withEmail,
  signUp,
  signIn,
  deleteusers,
  adminLogin,
  deleteadmins,
  googleAuth
};