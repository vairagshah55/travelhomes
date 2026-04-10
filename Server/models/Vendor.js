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

// Compound index for dashboard queries
// VendorSchema.index({ status: 1, brandName: 1 });
// VendorSchema.index({ location: 1 });

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
module.exports = Vendor;