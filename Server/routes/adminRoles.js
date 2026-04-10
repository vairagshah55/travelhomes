const express = require('express');
const mongoose = require('mongoose');
const AdminRole = require('../models/AdminRole');
const AdminStaff = require('../models/AdminStaff');
const router = express.Router();

// GET / - List all roles with filters, pagination, sorting
router.get('/', async (req, res) => {
  try {
    const {
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== undefined) {
      if (isActive === 'true' || isActive === true) query.isActive = true;
      else if (isActive === 'false' || isActive === false) query.isActive = false;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    // Fix sorting logic:
    const order = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;
    const sort = {};
    sort[String(sortBy)] = order;

    const roles = await AdminRole.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await AdminRole.countDocuments(query);
    res.json({
      success: true,
      roles,
      totalItems: total,
      currentPage: pageNum,
      itemsPerPage: limitNum
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /:id - Get single role by id
router.get('/:id', async (req, res) => {
  try {
    const role = await AdminRole.findById(req.params.id).populate('createdBy', 'name email');
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, role });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST / - Create role
router.post('/', async (req, res) => {
  try {
    console.log('[AdminRoles] Creating role with body:', JSON.stringify(req.body, null, 2));
    console.log('[AdminRoles] User:', req.user);

    const { name, description, features = [], permissions = [], isActive = true } = req.body;
    
    // Get creator from auth middleware if available
    let createdBy = req.body.createdBy;
    if (req.user) {
        createdBy = req.user.id || req.user._id;
    }

    // Validate createdBy if it exists
    if (createdBy && !mongoose.isValidObjectId(createdBy)) {
        console.warn('[AdminRoles] Invalid createdBy ID:', createdBy);
        createdBy = undefined; // Skip if invalid to prevent CastError
    }

    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const exists = await AdminRole.findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ success: false, message: 'Role already exists' });

    // Store as received, ideally validate features/permissions here
    const role = new AdminRole({
      name: name.trim(),
      description: (description || '').trim(),
      features: Array.isArray(features) ? features : [],
      permissions: Array.isArray(permissions) ? permissions : [],
      isActive,
      createdBy
    });
    
    console.log('[AdminRoles] Saving role...');
    const saved = await role.save();
    console.log('[AdminRoles] Role saved:', saved._id);
    
    // Only populate if createdBy is valid
    if (saved.createdBy) {
      try {
        await saved.populate('createdBy', 'name email');
      } catch (popError) {
        console.warn('[AdminRoles] Failed to populate creator:', popError.message);
      }
    }
    
    console.log('[AdminRoles] Role created successfully:', saved._id);
    res.status(201).json({ success: true, role: saved });
  } catch (error) {
    console.error('[AdminRoles] Create Error Full:', error);
    
    // Handle Mongoose Validation Errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

// PUT /:id - Update role
router.put('/:id', async (req, res) => {
  try {
    const { name, description, features, permissions, isActive } = req.body;
    const role = await AdminRole.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    if (name && name.trim() !== role.name) {
      const exists = await AdminRole.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (exists) return res.status(409).json({ success: false, message: 'Role name already in use' });
      role.name = name.trim();
    }
    if (description !== undefined) role.description = (description || '').trim();
    if (isActive !== undefined) role.isActive = isActive;
    if (features) role.features = Array.isArray(features) ? features : [];
    if (permissions) role.permissions = Array.isArray(permissions) ? permissions : [];
    const updated = await role.save();
    await updated.populate('createdBy', 'name email');
    res.json({ success: true, role: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /:id/toggle - Toggle role status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const role = await AdminRole.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    role.isActive = !role.isActive;
    const updated = await role.save();
    await updated.populate('createdBy', 'name email');
    res.json({ success: true, role: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /:id - Delete role
router.delete('/:id', async (req, res) => {
  try {
    const role = await AdminRole.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    const inUse = await AdminStaff.countDocuments({ roleId: req.params.id });
    if (inUse > 0) {
      return res.status(409).json({ success: false, message: 'Role in use by staff. Unassign before deletion.' });
    }
    await AdminRole.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /features/available - Available features (static or from model constant)
router.get('/features/available', (_req, res) => {
  try {
    // If available, serve from model static (e.g., AdminRole.AVAILABLE_FEATURES)
    res.json({ success: true, features: AdminRole.AVAILABLE_FEATURES || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /stats/overview - Role and feature usage stats (simplified)
router.get('/stats/overview', async (_req, res) => {
  try {
    const totalRoles = await AdminRole.countDocuments();
    const activeRoles = await AdminRole.countDocuments({ isActive: true });
    const inactiveRoles = await AdminRole.countDocuments({ isActive: false });
    // Staff per role
    const roleUsage = await AdminStaff.aggregate([
      { $group: { _id: '$roleId', count: { $sum: 1 } } }
    ]);
    res.json({
      success: true,
      summary: {
        totalRoles,
        activeRoles,
        inactiveRoles,
        roleUsage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;