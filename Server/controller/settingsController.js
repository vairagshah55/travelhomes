// Settings Controller (system & SEO) - robust, pure JS, no TS/garbage

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const SeoSetting = require('../models/SeoSetting');
const SystemSetting = require('../models/SystemSetting');

// --- GET SEO SETTING ---
const getSeoSetting = async (req, res) => {
  try {
    const page = req.query.page || 'Homepage';
    let setting;
    
    setting = await SeoSetting.findOne({ page });
    if (!setting) {
      setting = await SeoSetting.create({ page });
    }

    // Fetch global logo and favicon settings
    const logoSetting = await SeoSetting.findOne({ page: 'logo' });
    const faviconSetting = await SeoSetting.findOne({ page: 'favicon' });

    // Convert to object to allow modification
    const settingObj = setting.toObject();

    // Fallback to global settings if page-specific ones are missing
    if (!settingObj.logoUrl && logoSetting?.logoUrl) {
      settingObj.logoUrl = logoSetting.logoUrl;
    }
    if (!settingObj.logoDarkUrl && logoSetting?.logoDarkUrl) {
      settingObj.logoDarkUrl = logoSetting.logoDarkUrl;
    }
    if (!settingObj.faviconUrl && faviconSetting?.faviconUrl) {
      settingObj.faviconUrl = faviconSetting.faviconUrl;
    }
    
    res.status(200).json({ success: true, data: settingObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- UPSERT SEO SETTING ---
const upsertSeoSetting = async (req, res) => {
  try {
    const { page, ...data } = req.body;
    if (!page) return res.status(400).json({ success: false, message: "Missing page" });
    let setting;
    
    setting = await SeoSetting.findOneAndUpdate(
      { page },
      { $set: data },
      { new: true, upsert: true }
    );
    
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GET SYSTEM SETTING ---
const getSystemSetting = async (req, res) => {
  try {
    const userType = req.query.userType || 'Vendor';
    let setting;
    
    setting = await SystemSetting.findOne({ userType });
    if (!setting) {
      setting = await SystemSetting.create({ userType });
    }
    
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- UPDATE SYSTEM SETTING ---
const updateSystemSetting = async (req, res) => {
  try {
    const { userType, ...data } = req.body;
    if (!userType) return res.status(400).json({ success: false, message: "Missing userType" });
    let setting;
    
    setting = await SystemSetting.findOneAndUpdate(
      { userType },
      { $set: data },
      { new: true, upsert: true }
    );
    
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SEO Asset Upload (favicon/logo/og) ---
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  }
});
const upload = multer({ storage });

const uploadSeoAssetController = async (req, res) => {
  try {
    const { page, type } = req.body;
    const file = req.file;
    if (!page || !type) return res.status(400).json({ success: false, message: "Missing page or type" });
    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const url = `/uploads/${file.filename}`;
    let updated;
    const update = {};
    if (type === 'favicon') update.faviconUrl = url;
    if (type === 'logo') update.logoUrl = url;
    if (type === 'logo_dark') update.logoDarkUrl = url;
    if (type === 'og') update.ogImageUrl = url;
    
    updated = await SeoSetting.findOneAndUpdate(
      { page },
      { $set: update },
      { new: true, upsert: true }
    );
    
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- EXPORT ---
module.exports = {
  getSeoSetting,
  upsertSeoSetting,
  getSystemSetting,
  updateSystemSetting,
  uploadSeoAssetController,
  upload // Multer middleware for route use
};
