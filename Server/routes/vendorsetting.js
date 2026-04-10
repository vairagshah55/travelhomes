const express = require('express');
const { getVendorSetting, createVendorSetting, upsertVendorSetting, patchSection } = require('../controller/vendorSettingController');
const router = express.Router();
// Create initial settings document
router.post('/', createVendorSetting);
// Get full settings for a vendor
router.get('/:vendorId', getVendorSetting);
// Upsert full settings
router.put('/:vendorId', upsertVendorSetting);
// Update a specific section: general | account | preferences
router.patch('/:vendorId/:section', patchSection);
module.exports = router;