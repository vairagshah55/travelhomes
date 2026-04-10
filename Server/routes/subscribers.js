const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// @route   POST /api/subscribers
// @desc    Subscribe to newsletter
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if already subscribed
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      if (existingSubscriber.status === 'unsubscribed') {
        existingSubscriber.status = 'active';
        await existingSubscriber.save();
        return res.status(200).json({ success: true, message: 'Welcome back! You have successfully resubscribed.' });
      }
      return res.status(400).json({ success: false, message: 'Email is already subscribed' });
    }

    const newSubscriber = new Subscriber({
      email,
    });

    await newSubscriber.save();

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: newSubscriber,
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/subscribers
// @desc    Get all subscribers
// @access  Public (Should be Admin protected in production)
router.get('/', async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
