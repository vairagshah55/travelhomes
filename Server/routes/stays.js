const express = require('express');
const Stay = require('../models/Stay');
const Notification = require('../models/Notification');
const router = express.Router();

const asyncWrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// List stays (user side)
router.get('/', asyncWrap(async (req, res) => {
  const { status, city, state, q, page = '1', limit = '20' } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  if (city) filter['address.city'] = city;
  if (state) filter['address.state'] = state;
  if (q) filter.title = { $regex: q, $options: 'i' };
  
  const pageNum = Math.max(parseInt(page || '1', 10), 1);
  const limitNum = Math.min(Math.max(parseInt(limit || '20', 10), 1), 100);
  
  const [items, total] = await Promise.all([
    Stay.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Stay.countDocuments(filter)
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
}));

// Create stay (vendor side)
router.post('/', asyncWrap(async (req, res) => {
  const doc = await Stay.create(req.body);

  // Create Notification for Admin
  try {
    await Notification.create({
      type: 'service_approval',
      title: 'New Stay for Approval',
      message: `New stay "${doc.title}" submitted for approval.`,
      recipientRole: 'admin',
      referenceId: doc._id,
      referenceModel: 'Stay'
    });
  } catch (notifErr) {
    console.error('Error creating admin notification for stay:', notifErr);
  }

  res.status(201).json({ success: true, data: doc });
}));

// Get stay by id (user side)
router.get('/:id', asyncWrap(async (req, res) => {
  const { id } = req.params;
  
  if (!/^[a-f\d]{24}$/i.test(String(id))) {
    return res.status(400).json({ success: false, message: 'Invalid stay ID' });
  }
  
  const doc = await Stay.findById(id);
  if (!doc) return res.status(404).json({ success: false, message: 'Stay not found' });
  
  res.json({ success: true, data: doc });
}));

// Update stay (vendor side)
router.put('/:id', asyncWrap(async (req, res) => {
  const doc = await Stay.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ success: false, message: 'Stay not found' });
  
  res.json({ success: true, data: doc });
}));

// Delete stay (vendor side)
router.delete('/:id', asyncWrap(async (req, res) => {
  const doc = await Stay.findById(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Stay not found' });
  
  await doc.deleteOne();
  res.json({ success: true, message: 'Stay deleted successfully' });
}));

module.exports = router;