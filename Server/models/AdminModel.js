const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  uid: {
    type: Number,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: false,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [{
    type: String
  }],
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for better performance
const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
