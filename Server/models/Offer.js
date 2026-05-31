const mongoose = require('mongoose');
const { Schema } = mongoose;

const OfferSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    regularPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountPrice: {
      type: Number,
      min: 0,
      default: null
    },
    locality: String,
    pincode: String,
    features: [{
      type: String
    }],
    rules: [{
      type: String
    }],
    priceIncludes: [{
      type: String
    }],
    priceExcludes: [{
      type: String
    }],
    seatingCapacity: Number,
    sleepingCapacity: Number,
    guestCapacity: Number,
    numberOfBeds: Number,
    numberOfRooms: Number,
    numberOfBathrooms: Number,
    stayType: String,
    
    // Caravan specific pricing
    perKmCharge: Number,
    perDayCharge: Number,
    perKmIncludes: [{ type: String }],
    perKmExcludes: [{ type: String }],
    perDayIncludes: [{ type: String }],
    perDayExcludes: [{ type: String }],

    // Activity specific
    personCapacity: Number,
    timeDuration: String,
    expectations: [{ type: String }],
    
    address: String,
    serviceType: String,
    
    rooms: [], // Mixed array for room details
    priceDetails: [], // Mixed array for price details

    photos: {
      coverUrl: {
        type: String,
        default: ''
      },
      galleryUrls: [{
        type: String
      }]
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'cancelled', 'deactivated', 'blocked', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String
    },
    // Impressions are now stored exclusively in AdminAnalyticsMetric (per-day
    // rows keyed by serviceId), so the per-offer counter that used to live
    // here was dead code — only the admin reset endpoint touched it. Removed
    // to make AdminAnalyticsMetric.impressions the single source of truth.
    clicks: {
      type: Number,
      default: 0,
      min: 0
    },
    visitors: {
      type: Number,
      default: 0,
      min: 0
    },
    ratingsCount: {
      type: Number,
      default: 0
    },
    ratingsSum: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    userId: {
      type: String,
      index: true
    },
    vendorId: {
      type: String,
      index: true
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      refPath: 'sourceModel',
      index: true
    },
    sourceModel: {
      type: String,
      enum: ['ActivityOnboarding', 'CaravanOnboarding', 'StayOnboarding']
    },
    // ─── Discount offers ───────────────────────────────────────────────
    // Four optional discount "slots" the vendor can toggle on for an offer.
    // Each has an enabled flag, a type (percentage|fixed), a value, and the
    // pre-computed final price (so the UI doesn't have to recompute on read).
    // Stored as a sub-doc for grouping; null/undefined entries are absent.
    discounts: {
      firstUser: {
        enabled: { type: Boolean, default: false },
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: String, default: '' },
        finalPrice: { type: String, default: '' },
      },
      festival: {
        enabled: { type: Boolean, default: false },
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: String, default: '' },
        finalPrice: { type: String, default: '' },
      },
      weekly: {
        enabled: { type: Boolean, default: false },
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: String, default: '' },
        finalPrice: { type: String, default: '' },
      },
      special: {
        enabled: { type: Boolean, default: false },
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: String, default: '' },
        finalPrice: { type: String, default: '' },
      },
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
// OfferSchema.index({ status: 1 });
// OfferSchema.index({ category: 1 });
// OfferSchema.index({ city: 1, state: 1 });
// OfferSchema.index({ averageRating: -1 });
// OfferSchema.index({ regularPrice: 1 });

module.exports = mongoose.model('Offer', OfferSchema);