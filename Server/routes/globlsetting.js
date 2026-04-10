// Global settings routes: SEO & system settings, robust require
const express = require('express');
const { getSeoSetting, upsertSeoSetting, getSystemSetting, updateSystemSetting } = require('../controller/settingsController');
const router = express.Router();

// SEO settings (alias)
router.get('/seo', getSeoSetting);
router.put('/seo', upsertSeoSetting);

// System settings (alias)
router.get('/system', getSystemSetting);
router.put('/system', updateSystemSetting);

module.exports = router;