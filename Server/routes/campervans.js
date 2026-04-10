// CamperVan routes: CRUD + status update, RESTful, clean JS
const express = require('express');
const router = express.Router();
const CamperVan = require('../models/CamperVan');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification');

// List campervans (with filters & pagination): GET /
router.get('/', async (req, res) => {
  try {
    const { status, city, state, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (city) filter.city = city;
    if (state) filter.state = state;
    if (q) filter.name = { $regex: q, $options: 'i' };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      CamperVan.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      CamperVan.countDocuments(filter)
    ]);
    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
      }
    });
  } catch (error) {
    console.error('Error fetching campervans:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create campervan: POST /
router.post('/', async (req, res) => {
  try {
    const camperVan = new CamperVan(req.body);
    const saved = await camperVan.save();

    // Create Notification for Admin
    try {
      await Notification.create({
        type: 'service_approval',
        title: 'New Campervan for Approval',
        message: `New campervan "${saved.name}" submitted for approval.`,
        recipientRole: 'admin',
        referenceId: saved._id,
        referenceModel: 'CamperVan'
      });
    } catch (notifErr) {
      console.error('Error creating admin notification for campervan:', notifErr);
    }

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error('Error creating campervan:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get by id: GET /:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[a-f\d]{24}$/i.test(String(id))) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }
    const doc = await CamperVan.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error finding campervan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update by id: PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await CamperVan.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error updating campervan:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete by id: DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await CamperVan.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted', data: doc });
  } catch (error) {
    console.error('Error deleting campervan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update status: PATCH /:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doc = await CamperVan.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    // If approved, update Vendor status if currently pending
    if (status === 'approved' && doc.vendorId) {
      try {
         // doc.vendorId is String here (e.g. "VD1234")
         const vendor = await Vendor.findOne({ vendorId: doc.vendorId });
         if (vendor && (vendor.status === 'pending' || vendor.status === 'kyc-unverified')) {
           vendor.status = 'approved';
           await vendor.save();
           console.log(`[Campervan] Auto-approved vendor ${doc.vendorId} after service approval`);
         }
      } catch (vErr) {
         console.error('Error auto-approving vendor:', vErr);
      }
    }

    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error updating campervan status:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;