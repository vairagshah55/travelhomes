const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
  id: String,
  name: String,
  description: String,
  // Field names match the frontend Room interface exactly so Mongoose strict
  // mode doesn't silently drop them. Legacy docs may have capacity/bedCount —
  // the frontend normalises those on load.
  guestCapacity: { type: Number, default: 1 },
  beds: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  photos: [{ type: String }],
});

const StayOnboardingSchema = new Schema(
  {
    // Property selection
    selectedProperties: [{
      type: String
    }],
    
    selectedCategories: [{
      type: String
    }],
    
    stayType: {
      type: String,
      default: 'entire'
    },
    
    // Basic information
    propertyName: String,
    description: String,
    
    // Features
    selectedFeatures: [{
      type: String
    }],
    
    // Capacity
    guestCapacity: {
      type: Number,
      default: 2
    },
      numberOfRooms: {
      type: Number,
      default: 1
    },
    numberOfBeds: {
      type: Number,
      default: 1
    },
    numberOfBathrooms: {
      type: Number,
      default: 1
    },
    
    // Cover image (single hero photo separate from the gallery)
    coverImage: String,

    // Rooms
    rooms: [RoomSchema],

    // Pricing
    regularPrice: {
      type: Number,
      default: 0
    },
    finalPrice: {
      type: Number,
      default: 0
    },
    
    // Discounts & offers
    firstUserDiscount: Boolean,
    firstUserDiscountType: String,
    firstUserDiscountValue: String,
    
    discountType: String,
    discountPercentage: String,
    
    festivalOffers: Boolean,
    weeklyOffers: Boolean,
    specialOffers: Boolean,
    
    // Rules
    rules: [{
      type: String
    }],
    
    roomRules: {
      type: Map,
      of: [String]
    },
    
    optionalRules: [{
      type: String
    }],
    
    // Business Details
    brandName: String,
    companyName: String,
    gstNumber: String,
    businessEmail: String,
    businessPhone: String,
    businessAddress: String,
    locality: String,
    state: String,
    city: String,
    pincode: String,
    businessPincode: String,
    
    // Personal Details
    firstName: String,
    lastName: String,
    personalCountry: String,
    personalState: String,
    personalCity: String,
    personalPincode: String,
    dateOfBirth: Date,
    maritalStatus: String,
    idProof: String,
    
    idPhotos: [{
      type: String
    }],
    
    // Images/photos
    images: [{
      type: String
    }],
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft'
    },
    rejectionReason: String,
    userId: {
      type: String,
      index: true
    },
    vendorId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('StayOnboarding', StayOnboardingSchema);