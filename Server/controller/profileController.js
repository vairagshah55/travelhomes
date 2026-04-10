const Profile = require('../models/Profile');
const Register = require('../models/Register');
const Vendor = require('../models/Vendor');
const Offer = require('../models/Offer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });

  
}

// Multer storage for profile photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
    cb(null, `profile-${Date.now()}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// GET /api/profile?email=... or /api/profile/:email
const getProfile = async (req, res) => {
  try {
    const emailParam = req.params.email || req.query.email;
    
    if (!emailParam) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${escapeRegExp(emailParam)}$`, 'i');

    let profile = await Profile.findOne({ email: emailRegex });
    
    // If profile not found, try to sync from Register model
    if (!profile) {
      const registration = await Register.findOne({ email: emailRegex });
      if (registration) {
        profile = await Profile.create({
          email: registration.email,
          firstName: registration.firstName,
          lastName: registration.lastName,
          phoneNumber: registration.mobile,
          dateOfBirth: registration.dateOfBirth,
          country: registration.country,
          state: registration.state,
          city: registration.city,
        });
      }
    }

    if (!profile) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }
    
    // Fetch Vendor status (Vendor uses lowercase emails)
    let vendorDoc = await Vendor.findOne({ email: (profile.email || emailParam).toLowerCase() });
    const userDoc = await Register.findOne({ email: emailRegex });

    let vendorStatus = vendorDoc?.status;

    // Safety fallback: If vendor record missing but user has approved services, consider them approved
    if (!vendorStatus && userDoc) {
      const hasApproved = await Offer.exists({ userId: userDoc._id, status: 'approved' });
      if (hasApproved) {
        vendorStatus = 'approved';
        // Optional: Lazily create vendor record here? 
        // For now, just returning status is enough for UI to work.
      }
    }

    res.status(200).json({ 
      success: true, 
      data: {
        ...profile.toObject(),
        vendorStatus: vendorStatus,
        vendorDetails: vendorDoc,
        userType: userDoc?.userType
      }
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/profile (body must contain email)
const upsertProfile = async (req, res) => {
  try {
    const body = req.body || {};
    
    if (!body.email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const updated = await Profile.findOneAndUpdate(
      { email: body.email },
      { $set: body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({ success: false, message: 'Validation error', errors: messages });
    } else {
      console.error('Error in upsertProfile:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// POST /api/profile/photo (multipart form-data)
const uploadProfilePhoto = async (req, res) => {
  try {
    const email = req.body?.email || req.query.email;
    
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'Photo file is required' });
      return;
    }

    const photoUrl = `/uploads/${path.basename(file.path)}`;

    const updated = await Profile.findOneAndUpdate(
      { email },
      { $set: { photo: photoUrl } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in uploadProfilePhoto:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  upsertProfile,
  upload,
  uploadProfilePhoto
};
