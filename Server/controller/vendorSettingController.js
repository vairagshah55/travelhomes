const VendorSetting = require('../models/VendorSetting');

// GET /api/vendorsetting/:vendorId
const getVendorSetting = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const doc = await VendorSetting.findOne({ vendorId });
    
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor settings not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: doc 
    });
  } catch (err) {
    console.error('Get vendor setting error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// POST /api/vendorsetting
const createVendorSetting = async (req, res) => {
  try {
    const body = req.body;
    
    if (!body?.vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'vendorId is required' 
      });
    }
    
    const exists = await VendorSetting.findOne({ vendorId: body.vendorId });
    
    if (exists) {
      return res.status(409).json({ 
        success: false, 
        message: 'Vendor settings already exist' 
      });
    }
    
    const created = await VendorSetting.create(body);
    
    res.status(201).json({ 
      success: true, 
      data: created,
      message: 'Vendor settings created successfully' 
    });
  } catch (err) {
    console.error('Create vendor setting error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// PUT /api/vendorsetting/:vendorId (upsert)
const upsertVendorSetting = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const update = req.body;
    
    const doc = await VendorSetting.findOneAndUpdate(
      { vendorId },
      { $set: update },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );
    
    res.json({ 
      success: true, 
      data: doc,
      message: 'Vendor settings updated successfully' 
    });
  } catch (err) {
    console.error('Upsert vendor setting error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// PATCH /api/vendorsetting/:vendorId/:section
const patchSection = async (req, res) => {
  try {
    const { vendorId, section } = req.params;
    const updates = req.body;
    
    // Validate section
    const validSections = ['general', 'account', 'preferences'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section. Must be one of: ${validSections.join(', ')}`
      });
    }
    
    // Build update object with section prefix
    const updateObj = {};
    Object.keys(updates).forEach(key => {
      updateObj[`${section}.${key}`] = updates[key];
    });
    
    const doc = await VendorSetting.findOneAndUpdate(
      { vendorId },
      { $set: updateObj },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );
    
    res.json({ 
      success: true, 
      data: doc,
      message: `${section} section updated successfully` 
    });
  } catch (err) {
    console.error('Patch section error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

module.exports = {
  getVendorSetting,
  createVendorSetting,
  upsertVendorSetting,
  patchSection,
};