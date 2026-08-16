const mongoose = require('mongoose');
const { Schema } = mongoose;

const VendorSchema = new Schema({
  vendorId: {
    type: String,
    unique: true,
    trim: true,
    default: function () {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      return `VD${randomId}`;
    }
  },
  photo: {
    type: String,
    trim: true,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  },
  brandName: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  personName: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true
  },
  listedServices: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'inactive', 'banned', 'kyc-unverified'],
    default: 'pending',
    index: true,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminStaff'
  },
  servicesOffered: [{
    type: String,
    trim: true
  }],
  ratings: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count:   { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

/**
 * Indexes.
 *
 * `email` is the hottest lookup in the codebase — `Vendor.findOne({ email })`
 * runs on every offers listing (applyOwnerFilter + the impression-tracking
 * self-exclusion in `list`), on offer create/read, on onboarding, and three
 * times in vendor-chats. It had no index at all, so each of those was a
 * collection scan.
 *
 * Deliberately NOT unique: vendor-auth's `Vendor.updateMany({ email })` on
 * email change assumes several vendor rows can share an address, and a unique
 * index would reject existing data.
 */
VendorSchema.index({ email: 1 });

// Admin dashboard: filter by status, list alphabetically.
VendorSchema.index({ status: 1, brandName: 1 });

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
module.exports = Vendor;