const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    userId: {
      type: String,
      unique: true,
      default: function() {
        const randomId = Math.floor(1000 + Math.random() * 9000);
        return `AD${randomId}`;
      },
    },
    name: {
      type: String,
      trim: true,
      default: 'Guest User'
    },
    fullname: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      trim: true
    },
    photo: {
      type: String,
      default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    },
    userSince: {
      type: Date,
      required: [true, 'User since date is required'],
      default: Date.now,
    },
    bookedServices: {
      type: String,
      default: 'XYZ',
    },
    location: {
      type: String,
      trim: true,
      default: 'Not specified'
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    uid: {
      type: Number
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    userType: {
      type: String,
      enum: ['user', 'vendor'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    password: {
      type: String
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned', 'unverified-email', 'unverified-mobile', 'subscriber'],
      default: 'active',
    },
    role: {
      type: String,
      enum: ['user', 'vendor', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);