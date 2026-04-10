const Plugin = require('../models/Plugin');

const listPlugins = async (req, res) => {
  try {
    const q = req.query.q || '';
    const filter = q ? { vendorName: { $regex: q, $options: 'i' } } : {};
    const items = await Plugin.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error in listPlugins:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPlugin = async (req, res) => {
  try {
    const item = await Plugin.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Plugin not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error in getPlugin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPlugin = async (req, res) => {
  try {
    const { vendorName, enabled = false, description = '', licenseKey = '' } = req.body;
    
    if (!vendorName) {
      return res.status(400).json({ success: false, message: 'vendorName is required' });
    }
    
    const exists = await Plugin.findOne({ vendorName: vendorName.trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Plugin with this vendor name already exists' });
    }
    
    const created = await Plugin.create({
      vendorName: vendorName.trim(),
      enabled: !!enabled,
      description: description?.trim() || '',
      licenseKey: licenseKey?.trim() || ''
    });
    
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error in createPlugin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePlugin = async (req, res) => {
  try {
    const { vendorName, enabled, description, licenseKey } = req.body;
    const plugin = await Plugin.findById(req.params.id);
    
    if (!plugin) {
      return res.status(404).json({ success: false, message: 'Plugin not found' });
    }
    
    if (vendorName && vendorName.trim() !== plugin.vendorName) {
      const exists = await Plugin.findOne({ 
        vendorName: vendorName.trim(), 
        _id: { $ne: req.params.id } 
      });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Plugin with this vendor name already exists' });
      }
      plugin.vendorName = vendorName.trim();
    }
    
    if (enabled !== undefined) plugin.enabled = !!enabled;
    if (description !== undefined) plugin.description = description?.trim() || '';
    if (licenseKey !== undefined) plugin.licenseKey = licenseKey?.trim() || '';
    
    const saved = await plugin.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error in updatePlugin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const togglePlugin = async (req, res) => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    if (!plugin) {
      return res.status(404).json({ success: false, message: 'Plugin not found' });
    }
    
    plugin.enabled = !plugin.enabled;
    const saved = await plugin.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error in togglePlugin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const setPluginLicense = async (req, res) => {
  try {
    const { licenseKey } = req.body;
    
    if (licenseKey === undefined) {
      return res.status(400).json({ success: false, message: 'licenseKey is required' });
    }
    
    const plugin = await Plugin.findById(req.params.id);
    if (!plugin) {
      return res.status(404).json({ success: false, message: 'Plugin not found' });
    }
    
    plugin.licenseKey = (licenseKey || '').trim();
    const saved = await plugin.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error in setPluginLicense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const removePlugin = async (req, res) => {
  try {
    const deleted = await Plugin.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Plugin not found' });
    }
    
    res.json({ success: true, message: 'Plugin deleted successfully' });
  } catch (error) {
    console.error('Error in removePlugin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listPlugins,
  getPlugin,
  createPlugin,
  updatePlugin,
  togglePlugin,
  setPluginLicense,
  removePlugin
};
