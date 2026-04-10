const mongoose = require('mongoose');
const { Schema } = mongoose;

const SocialProfileSchema = new Schema({
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube']
  },
  url: {
    type: String,
    required: true
  },
  username: {
    type: String,
    default: ''
  }
});

const ProfileSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    phoneNumber: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    maritalStatus: { type: String, trim: true, default: '' },
    idProof: { type: String, trim: true, default: '' },
    idPhotos: { type: [String], default: [] },
    photo: { type: String, trim: true, default: '' },
    socialProfiles: { type: [SocialProfileSchema], default: [] },
    
    // Detailed Personal Address
    personalLocality: { type: String, trim: true, default: '' },
    personalPincode: { type: String, trim: true, default: '' },

    business: {
      brandName: { type: String, trim: true, default: '' },
      legalCompanyName: { type: String, trim: true, default: '' },
      gstNumber: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      phoneNumber: { type: String, trim: true, default: '' },
      locality: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
      businessName: { type: String, trim: true, default: '' } // Keeping for backward compatibility if any
    }
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model('Profile', ProfileSchema);