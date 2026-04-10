const express = require('express');
const { getSeoSetting, upsertSeoSetting, getSystemSetting, updateSystemSetting, upload, uploadSeoAssetController } = require('../controller/settingsController');
const router = express.Router();
// SEO settings
router.get('/seo', getSeoSetting);
router.put('/seo', upsertSeoSetting);
router.post('/seo/upload', upload.single('image'), uploadSeoAssetController);
// System (other) settings
router.get('/system', getSystemSetting);
router.put('/system', updateSystemSetting);
module.exports = router;