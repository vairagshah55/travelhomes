const mongoose = require('mongoose');
const { Schema } = mongoose;

const CaravanOnboardingSchema = new Schema(
  {
    // Basic info
    name: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      // enum: ['caravan', 'motorhome', 'campervan', 'rv'],
      required: true
      // default: 'caravan'
    },
    
    // Capacity
    seatingCapacity: {
      type: Number,
      default: 2
    },
    sleepingCapacity: {
      type: Number,
      default: 2
    },
    
    // Location
    locality: String,
    city: String,
    state: String,
    pincode: String,
    address: String,
    
    // Pricing
    perDayCharge: {
      type: Number,
      default: 0
    },
    perKmCharge: {
      type: Number,
      default: 0
    },
    finalPrice: {
      type: Number,
      default: 0
    },
    
    // Features and amenities
    features: [{
      type: String
    }],
    rules: [{
      type: String
    }],
    
    // Price details
    priceIncludes: [{
      type: String
    }],
    priceExcludes: [{
      type: String
    }],
    perKmIncludes: [{
      type: String
    }],
    perKmExcludes: [{
      type: String
    }],
    perDayIncludes: [{
      type: String
    }],
    perDayExcludes: [{
      type: String
    }],
    
    // Discounts
    firstUserDiscount: Boolean,
    firstUserDiscountType: String,
    firstUserDiscountValue: String,
    firstUserDiscountFinalPrice: String,

    festivalOffers: Boolean,
    festivalOffersType: String,
    festivalOffersValue: String,
    festivalOffersFinalPrice: String,

    weeklyMonthlyOffers: Boolean,
    weeklyMonthlyOffersType: String,
    weeklyMonthlyOffersValue: String,
    weeklyMonthlyOffersFinalPrice: String,

    specialOffers: Boolean,
    specialOffersType: String,
    specialOffersValue: String,
    specialOffersFinalPrice: String,
    
    // Photos
    photos: [{
      type: String
    }],
    coverImage: [{
      type: String
    }],
    
    // ID Photos/selfies
    idPhotos: [{
      type: String
    }],
    
    // Business details
    businessName: String,
    businessEmail: String,
    businessPhone: String,
    businessLocality: String,
    gstNumber: String,
    
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
    },
    personalLocality: String,
    termsAccepted: Boolean
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('CaravanOnboarding', CaravanOnboardingSchema);