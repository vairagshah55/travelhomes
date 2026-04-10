const mongoose = require('mongoose');
const { Schema } = mongoose;

const ManagementSchema = new Schema({
  brandName: {
    type: String,
    required: true,
    trim: true
  },
  personName: {
    type: String,
    required: true,
    trim: true
  },
  serviceName: {
    type: String,
    required: true,
    enum: ['activity', 'camper-van', 'unique-stay'],
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  images: [{
    type: String,
    trim: true
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  capacity: {
    type: Number,
    min: 1
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingPolicy: {
    cancellationPolicy: String,
    checkInTime: String,
    checkOutTime: String,
    minimumStay: Number
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
// ManagementSchema.index({ serviceName: 1, status: 1 });
// ManagementSchema.index({ location: 1 });
// ManagementSchema.index({ vendorId: 1 });
// ManagementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Management', ManagementSchema);