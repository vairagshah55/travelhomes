const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminStaffSchema = new Schema({
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    required: true,
    trim: true,
    default: 'Admin'
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: 'AdminRole'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    required: true
  },
  joinDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  lastLogin: {
    type: Date
  },
  avatar: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  salary: {
    type: Number,
    min: 0
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'USA' }
  },
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relationship: { type: String, trim: true }
  }
}, { timestamps: true });

// (Optional) Compute full name before save, if needed
AdminStaffSchema.pre('save', function(next) {
  if (this.firstName && this.lastName && !this.name) {
    this.name = `${this.firstName} ${this.lastName}`.trim();
  }
  next();
});

module.exports = mongoose.models.AdminStaff || mongoose.model('AdminStaff', AdminStaffSchema);