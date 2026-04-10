const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: Number,
    required: true,
    unique: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  fullname: {
    type: String,
    required: false,
    trim: true
  },
  username: {
    type: String,
    required: false,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  }
}, {
  timestamps: true
});



const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
