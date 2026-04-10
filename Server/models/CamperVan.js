// CamperVan Mongoose Model (clean, TS-free, JS/NodeJS, matches route usage)
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CamperVanSchema = new Schema(
  {
    vendorId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    locality: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    features: [{ type: String }],
    images: [{ type: String }],
    pricePerDay: { type: Number, default: 0 },
    maxGuests: { type: Number, default: 2 },
    phone: { type: String },
    email: { type: String },
    // Add more fields as needed
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Add indexes for fast lookup
CamperVanSchema.index({ city: 1 });
CamperVanSchema.index({ state: 1 });
CamperVanSchema.index({ status: 1 });

// Always update `updatedAt`
CamperVanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.CamperVan || mongoose.model('CamperVan', CamperVanSchema);