const mongoose = require('mongoose');
require('dotenv').config();
const Notification = require('./models/Notification');
const Vendor = require('./models/Vendor');

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelhomes';
    console.log('Connecting to', uri);
    await mongoose.connect(uri);
    
    const vendor = await Vendor.findOne();
    if (vendor) {
      console.log('Found vendor:', vendor.email, vendor._id);
      
      // Clear existing test notifications for this vendor to avoid clutter
      await Notification.deleteMany({ recipientId: vendor._id });
      
      await Notification.create([
        {
          type: 'service_approval',
          title: 'Service Approved',
          message: 'Your activity "Caravan Adventure" has been approved by admin.',
          recipientRole: 'vendor',
          recipientId: vendor._id,
          isRead: false,
          createdAt: new Date()
        },
        {
          type: 'new_booking',
          title: 'New Booking',
          message: 'You have a new booking for "Desert Safari" from John Doe.',
          recipientRole: 'vendor',
          recipientId: vendor._id,
          isRead: false,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        }
      ]);
      console.log('Mock notifications created successfully');
    } else {
      console.log('No vendor found in database');
    }
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
}

seed();
