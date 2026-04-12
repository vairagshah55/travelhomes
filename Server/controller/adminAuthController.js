const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminStaff = require('../models/AdminStaff');
const Admin = require('../models/AdminModel');

/**
 * Helper to sign JWT tokens for admin
 */
function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'defaultsecret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * POST /api/admin/auth/login
 * Admin staff login with email/password.
 */
const loginAdmins = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }
    const staff = await AdminStaff.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!staff || !staff.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, staff.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password',
      });
    }

    if (staff.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account not active. Contact admin.',
      });
    }

    await AdminStaff.updateOne({ _id: staff._id }, { $set: { lastLogin: new Date() } }).catch(() => {});

    const token = signToken({
      sub: staff._id,
      type: 'admin',
      role: staff.role,
      email: staff.email,
      name: staff.name,
    });

    return res.json({
      success: true,
      token,
      admin: {
        name: staff.name,
        email: staff.email,
        role: staff.role,
        status: staff.status,
        joinDate: staff.joinDate,
        lastLogin: staff.lastLogin
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password',
      });
    }

    const token = signToken({
      sub: admin._id,
      type: 'superadmin',
      role: admin.role,
      email: admin.email,
    });

    return res.status(200).json({
      status: 'success',
      token,
      message: 'You are signed in successfully!',
      admin: {
        token,
      },
    });
  } catch (error) {
    console.error('Error in adminLogin:', error);
    return res.status(500).json({ "status": "error", "errorlog": error, message: 'Something went wrong!!' });
  }
};


const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const existingUser = await Admin.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Admin({
      uid: "45612378958",
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
    });

    await newUser.save(); // 🔥 THIS WAS MISSING

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      admin: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Admin register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /api/admin/auth/me
 * Get current admin info based on JWT.
 */
const getMe = async (req, res) => {
  try {
    // Auth middleware should populate req.user
    const user = req.user;
    if (!user?.sub) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }
    
    let staff = await AdminStaff.findById(user.sub);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    return res.json({
      success: true,
      admin: {
        name: staff.name,
        email: staff.email,
        role: staff.role,
        status: staff.status,
        joinDate: staff.joinDate,
        lastLogin: staff.lastLogin
      }
    });
  } catch (err) {
    console.error('Get admin me error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  loginAdmin,
  loginAdmins,
  registerAdmin,
  getMe,
};
