const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 300 // 5 minutes
  }
}, {
  timestamps: true
});

// Create index on mobile for faster queries
// otpSchema.index({ mobile: 1 });

const Otp = mongoose.model('Otp', otpSchema);
module.exports = Otp;
