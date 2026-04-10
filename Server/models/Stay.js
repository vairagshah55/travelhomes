const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddressSchema = new Schema({
  locality: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  country: { type: String, default: 'India' }
});

const RoomSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  capacity: { type: Number, default: 1 },
  bedCount: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  amenities: [{ type: String }],
  photos: [{ type: String }]
});

const StaySchema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['hotel', 'resort', 'homestay', 'apartment', 'villa'],
      default: 'hotel'
    },
    address: {
      type: AddressSchema,
      required: true
    },
    photos: [{
      type: String
    }],
    rooms: [RoomSchema],
    amenities: [{
      type: String
    }],
    policies: {
      checkIn: { type: String, default: '14:00' },
      checkOut: { type: String, default: '12:00' },
      cancellation: { type: String, default: '' },
      rules: [{ type: String }]
    },
    pricing: {
      basePrice: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      taxRate: { type: Number, default: 0 }
    },
    priceIncludes: [{
      type: String
    }],
    priceExcludes: [{
      type: String
    }],
    availability: {
      isActive: { type: Boolean, default: true },
      minStay: { type: Number, default: 1 },
      maxStay: { type: Number, default: 30 }
    },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'suspended'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
// StaySchema.index({ vendorId: 1 });
// StaySchema.index({ status: 1 });
// StaySchema.index({ 'address.city': 1 });
// StaySchema.index({ 'address.state': 1 });
// StaySchema.index({ category: 1 });
// StaySchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Stay', StaySchema);