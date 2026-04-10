const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationsSchema = new Schema({
  email: {
    bookingConfirmation: { type: Boolean, default: true },
    paymentUpdates: { type: Boolean, default: true },
    reviewAlerts: { type: Boolean, default: true },
    promotionalEmails: { type: Boolean, default: false }
  },
  sms: {
    bookingConfirmation: { type: Boolean, default: false },
    paymentUpdates: { type: Boolean, default: false },
    reviewAlerts: { type: Boolean, default: false }
  },
  push: {
    bookingConfirmation: { type: Boolean, default: true },
    paymentUpdates: { type: Boolean, default: true },
    reviewAlerts: { type: Boolean, default: true }
  }
});

const VendorSettingSchema = new Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    unique: true
  },
  account: {
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    supportEmail: { type: String }
  },
  preferences: {
    language: { type: String, default: 'en' }, // e.g., 'en'
    timezone: { type: String, default: 'Asia/Kolkata' }, // e.g., 'Asia/Kolkata'
    notifications: NotificationsSchema
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
VendorSettingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.VendorSetting || mongoose.model('VendorSetting', VendorSettingSchema);