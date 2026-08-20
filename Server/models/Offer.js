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

    // ─── Vehicle rental specific (serviceType === 'vehicle-rental') ──────
    // These four are the guest-facing search filters, so they're structured
    // fields rather than entries in the free-form `features` array — a filter
    // can't reliably match "Automatic" inside a string list that also holds
    // amenity names.
    vehicleClass: {
      type: String,
      enum: ['car', 'van', 'bus']
    },
    brand: String,
    model: String,
    manufactureYear: Number,
    registrationNumber: String,
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']
    },
    transmission: {
      type: String,
      enum: ['Manual', 'Automatic']
    },
    airConditioned: { type: Boolean, default: false },
    luggageCapacity: Number,
    pickupPoints: [{ type: String }],

    // Self-drive rate card — present only when the vendor enabled that mode.
    selfDriveEnabled: { type: Boolean, default: false },
    selfDrivePerDay: Number,
    selfDrivePerKm: Number,
    freeKmPerDay: Number,
    extraKmCharge: Number,
    securityDeposit: Number,
    minRentalHours: Number,
    selfDriveIncludes: [{ type: String }],
    selfDriveExcludes: [{ type: String }],

    // Chauffeur-driven rate card.
    withDriverEnabled: { type: Boolean, default: false },
    withDriverPerDay: Number,
    withDriverPerKm: Number,
    driverAllowancePerDay: Number,
    /** Hour (0-23) after which the night charge applies. */
    nightChargeAfter: Number,
    outstationPerKm: Number,
    withDriverIncludes: [{ type: String }],
    withDriverExcludes: [{ type: String }],

    fuelPolicy: {
      type: String,
      enum: ['included', 'excluded', 'same-to-same']
    },
    tollsAndParking: {
      type: String,
      enum: ['included', 'on-actuals']
    },
    cancellationWindowHours: Number,


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
      enum: ['ActivityOnboarding', 'CaravanOnboarding', 'StayOnboarding', 'VehicleOnboarding']
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

/**
 * Indexes.
 *
 * Offer is the catalog collection every browse / search / admin-listing surface
 * reads from, and `status` is on essentially every query — modules/offers
 * `buildListFilter` pins `status: "approved"` for public traffic, and
 * modules/management `list` filters by status too. These were commented out, so
 * each of those queries (plus the matching `countDocuments`) was a full
 * collection scan followed by an in-memory sort.
 *
 * Compound rather than single-field: MongoDB can only use one index per query,
 * so pairing the `status` equality with the sort key lets the same index satisfy
 * both the filter and the ordering, and keeps the sort from spilling to memory.
 */
OfferSchema.index({ status: 1, createdAt: -1 }); // default listing + newest-first
OfferSchema.index({ status: 1, averageRating: -1, ratingsCount: -1 }); // sort=rating
OfferSchema.index({ status: 1, regularPrice: 1 }); // sort=price_asc / price_desc
// Added with the vehicle-rental facets: /api/offers?serviceType=… is now the
// primary browse query for every service tab, so it pairs the two equalities
// with the default newest-first sort.
OfferSchema.index({ status: 1, serviceType: 1, createdAt: -1 });
OfferSchema.index({ category: 1 });
OfferSchema.index({ city: 1, state: 1 });

module.exports = mongoose.model('Offer', OfferSchema);