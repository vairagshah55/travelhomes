const mongoose = require('mongoose');

const RegisterSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['user', 'vendor'],
    required: true,
  },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  mobile: { type: String, default: '' },
  dateOfBirth: { type: Date },
  country: { type: String, default: '' },
  state: { type: String, default: '' },
  city: { type: String, default: '' },
  passwordHash: { type: String, required: true },
  otp: { type: String },
  otpExpiresAt: { type: Date },
  otpVerified: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Unique index to prevent duplicate registration per type/email
// RegisterSchema.index({ email: 1, userType: 1 }, { unique: true });

module.exports = mongoose.model('Register', RegisterSchema);