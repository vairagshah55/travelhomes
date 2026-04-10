const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivityOnboardingSchema = new Schema(
  {
    // Step 0 - Activity selection
    selectedActivities: [{
      type: String
    }],
    
    // Basic information
    activityName: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    category: {
      type: String,
      default: 'activity'
    },
    
    // Location information
    locality: String,
    city: String,
    state: String,
    pincode: String,
    
    // Capacity
    personCapacity: {
      type: Number,
      default: 1
    },
    timeDuration: String,
    
    // Pricing
    regularPrice: {
      type: Number,
      default: 0
    },
    finalPrice: {
      type: Number,
      default: 0
    },
    
    // Price details
    priceIncludes: [{
      type: String
    }],
    priceExcludes: [{
      type: String
    }],
    expectations: [{
      type: String
    }],
    
    // Discounts
    firstUserDiscount: Boolean,
    discountType: String,
    discountAmount: String,
    // finalPrice already defined above

    festivalOffers: Boolean,
    festivalDiscountType: String,
    festivalDiscountAmount: String,
    festivalFinalPrice: String,

    weeklyOffers: Boolean,
    weeklyDiscountType: String,
    weeklyDiscountAmount: String,
    weeklyFinalPrice: String,

    specialOffers: Boolean,
    specialDiscountType: String,
    specialDiscountAmount: String,
    specialFinalPrice: String,

    // Photos
    photos: [{
      type: String
    }],
    coverImage: {
      type: String
    },
    
    // ID Photos/selfies
    idPhotos: [{
      type: String
    }],
    
    // Additional fields
    features: [{
      type: String
    }],
    rules: [{
      type: String
    }],
    rulesAndRegulations: [{
      type: String
    }],
    
    // Business Details
    brandName: String,
    legalCompanyName: String,
    gstNumber: String,
    businessEmail: String,
    businessPhone: String,
    businessLocality: String,
    businessState: String,
    businessCity: String,
    businessPincode: String,
    
    // Personal Details
    firstName: String,
    lastName: String,
    personalLocality: String,
    personalState: String,
    personalCity: String,
    personalPincode: String,
    dateOfBirth: String,
    maritalStatus: String,
    idProof: String,
    
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

module.exports = mongoose.model('ActivityOnboarding', ActivityOnboardingSchema);