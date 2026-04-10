const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification');
const { requireJwt } = require('../middleware/auth');

// Helper to wrap async functions
const asyncWrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Get all activities with filters
// @route   GET /api/activities/
// @access  Public
router.get('/', asyncWrap(async (req, res) => {
  const { q, city, state, category, minPrice, maxPrice, page = '1', limit = '20' } = req.query;
  
  // Use MongoDB
  const filter = { status: 'approved' };
  
  if (city) filter.city = city;
  if (state) filter.state = state;
  
  // Search in name and description
  const or = [];
  if (q) {
    or.push(
      { name: { $regex: q, $options: 'i' } }, 
      { description: { $regex: q, $options: 'i' } }
    );
  }
  if (category) {
    or.push({ name: { $regex: category, $options: 'i' } });
  }
  if (or.length) filter.$or = or;
  
  // Price filter
  if (minPrice || maxPrice) {
    filter.regularPrice = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {})
    };
  }
  
  // Pagination
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  const skip = (pageNum - 1) * limitNum;
  
  try {
    const [items, total] = await Promise.all([
      Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Activity.countDocuments(filter),
    ]);
    
    res.json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
}));

// @desc    Get activity by ID
// @route   GET /api/activities/:id
// @access  Public
router.get('/:id', asyncWrap(async (req, res) => {
  const { id } = req.params;
  
  if (!/^[a-f\d]{24}$/i.test(String(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid activity ID format'
    });
  }
  
  try {
    const doc = await Activity.findById(id);
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activity',
      error: error.message
    });
  }
}));

// @desc    Get vendor's own activities
// @route   GET /api/activities/vendor/mine/list
// @access  Private (Vendor)
router.get('/vendor/mine/list', requireJwt(), asyncWrap(async (req, res) => {
  const vendorId = req.user?.id || req.user?._id || req.user?.vendorId;
  
  if (!vendorId) {
    return res.status(400).json({
      success: false,
      message: 'Vendor ID not found'
    });
  }
  
  try {
    const list = await Activity.find({ vendorId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor activities',
      error: error.message
    });
  }
}));

// @desc    Create new activity
// @route   POST /api/activities/
// @access  Private (Vendor)
router.post('/', requireJwt(), asyncWrap(async (req, res) => {
  const payload = req.body || {};
  const vendorId = req.user?.id || req.user?._id || req.user?.vendorId || payload.vendorId;
  
  if (!vendorId) {
    return res.status(400).json({
      success: false,
      message: 'Vendor ID is required'
    });
  }
  
  try {
    const doc = await Activity.create({ ...payload, vendorId });
    
    // Create Notification for Admin
    try {
      await Notification.create({
        type: 'service_approval',
        title: 'New Activity for Approval',
        message: `New activity "${doc.title || doc.name}" submitted for approval by vendor ${vendorId}.`,
        recipientRole: 'admin',
        referenceId: doc._id,
        referenceModel: 'Activity'
      });
    } catch (notifErr) {
      console.error('Error creating admin notification for activity:', notifErr);
    }

    res.status(201).json({
      success: true,
      data: doc,
      message: 'Activity created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating activity',
      error: error.message
    });
  }
}));

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private (Vendor)
router.put('/:id', requireJwt(), asyncWrap(async (req, res) => {
  const id = req.params.id;
  const vendorId = req.user?.id || req.user?._id || req.user?.vendorId;
  
  try {
    const doc = await Activity.findById(id);
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    if (vendorId && String(doc.vendorId) !== String(vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this activity'
      });
    }
    
    Object.assign(doc, req.body || {});
    await doc.save();
    
    res.json({
      success: true,
      data: doc,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating activity',
      error: error.message
    });
  }
}));

// @desc    Update activity status
// @route   PATCH /api/activities/:id/status
// @access  Private (Vendor/Admin)
router.patch('/:id/status', requireJwt(), asyncWrap(async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  
  if (!['draft', 'published', 'archived', 'approved', 'pending', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }
  
  try {
    const doc = await Activity.findById(id);
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    const vendorId = req.user?.id || req.user?._id || req.user?.vendorId;
    const isAdmin = req.user?.type === 'admin' || req.user?.role === 'admin';
    
    if (!isAdmin && vendorId && String(doc.vendorId) !== String(vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this activity status'
      });
    }
    
    doc.status = status;
    await doc.save();

    // Create notification for vendor if approved/rejected by admin
    if (isAdmin && (status === 'approved' || status === 'rejected')) {
      // If approved, update Vendor status if currently pending
      if (status === 'approved') {
        try {
           const vendor = await Vendor.findById(doc.vendorId);
           if (vendor && (vendor.status === 'pending' || vendor.status === 'kyc-unverified')) {
             vendor.status = 'approved';
             await vendor.save();
             console.log(`[Activity] Auto-approved vendor ${doc.vendorId} after service approval`);
           }
        } catch (vErr) {
           console.error('Error auto-approving vendor:', vErr);
        }
      }

      try {
        await Notification.create({
          type: status === 'approved' ? 'service_approval' : 'service_rejection',
          title: `Service ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your activity "${doc.title || doc.name}" has been ${status} by admin.`,
          recipientRole: 'vendor',
          recipientId: doc.vendorId,
          referenceId: doc._id,
          referenceModel: 'Activity'
        });
        console.log(`[Notification] Created ${status} notification for vendor ${doc.vendorId}`);
      } catch (notifErr) {
        console.error('Error creating notification:', notifErr);
        // Don't fail the request if notification fails
      }
    }
    
    res.json({
      success: true,
      data: doc,
      message: 'Activity status updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating activity status',
      error: error.message
    });
  }
}));

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private (Vendor/Admin)
router.delete('/:id', requireJwt(), asyncWrap(async (req, res) => {
  const id = req.params.id;
  const vendorId = req.user?.id || req.user?._id || req.user?.vendorId;
  const isAdmin = req.user?.type === 'admin' || req.user?.role === 'admin';
  
  try {
    const doc = await Activity.findById(id);
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    if (!isAdmin && vendorId && String(doc.vendorId) !== String(vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this activity'
      });
    }
    
    await Activity.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting activity',
      error: error.message
    });
  }
}));

module.exports = router;
