const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Vendor submission for the Vehicle Rental service (car / van / bus).
 *
 * Deliberately shaped like CaravanOnboarding — same status lifecycle, same
 * business/personal/discount blocks, same photo arrays — so the shared
 * onboarding pipeline (submitOnboarding → supersedePreviousSubmissions →
 * auto-created Offer) works on it without special-casing.
 *
 * What's genuinely different from a caravan:
 *   - a vehicle has an identity (class/brand/model/year/registration) that
 *     guests filter on, so those are columns rather than free-text features;
 *   - it can be rented in two modes with independent rate cards (self-drive vs
 *     chauffeur-driven) instead of one per-km/per-day pair;
 *   - it carries compliance documents with expiry dates (insurance, PUC, RC).
 */
const VehicleOnboardingSchema = new Schema(
  {
    // ─── Basic info ────────────────────────────────────────────────────
    name: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      required: true
    },

    // ─── Vehicle identity ──────────────────────────────────────────────
    vehicleClass: {
      type: String,
      enum: ['car', 'van', 'bus'],
      required: true
    },
    brand: String,
    model: String,
    manufactureYear: Number,
    registrationNumber: String,

    // ─── Specs ─────────────────────────────────────────────────────────
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']
    },
    transmission: {
      type: String,
      enum: ['Manual', 'Automatic']
    },
    airConditioned: {
      type: Boolean,
      default: false
    },

    // ─── Capacity ──────────────────────────────────────────────────────
    seatingCapacity: {
      type: Number,
      default: 4
    },
    luggageCapacity: {
      type: Number,
      default: 0
    },

    // ─── Location ──────────────────────────────────────────────────────
    locality: String,
    city: String,
    state: String,
    pincode: String,
    address: String,
    pickupPoints: [{
      type: String
    }],

    // ─── Self-drive rate card ──────────────────────────────────────────
    selfDriveEnabled: {
      type: Boolean,
      default: false
    },
    selfDrivePerDay: {
      type: Number,
      default: 0
    },
    selfDrivePerKm: {
      type: Number,
      default: 0
    },
    freeKmPerDay: {
      type: Number,
      default: 0
    },
    extraKmCharge: {
      type: Number,
      default: 0
    },
    securityDeposit: {
      type: Number,
      default: 0
    },
    minRentalHours: {
      type: Number,
      default: 24
    },
    selfDriveIncludes: [{
      type: String
    }],
    selfDriveExcludes: [{
      type: String
    }],

    // ─── Chauffeur-driven rate card ────────────────────────────────────
    withDriverEnabled: {
      type: Boolean,
      default: false
    },
    withDriverPerDay: {
      type: Number,
      default: 0
    },
    withDriverPerKm: {
      type: Number,
      default: 0
    },
    driverAllowancePerDay: {
      type: Number,
      default: 0
    },
    /** Hour (0-23) after which the night charge applies. */
    nightChargeAfter: {
      type: Number,
      default: 22
    },
    outstationPerKm: {
      type: Number,
      default: 0
    },
    withDriverIncludes: [{
      type: String
    }],
    withDriverExcludes: [{
      type: String
    }],

    // ─── Shared rental terms ───────────────────────────────────────────
    fuelPolicy: {
      type: String,
      enum: ['included', 'excluded', 'same-to-same'],
      default: 'excluded'
    },
    tollsAndParking: {
      type: String,
      enum: ['included', 'on-actuals'],
      default: 'on-actuals'
    },
    cancellationWindowHours: {
      type: Number,
      default: 24
    },
    finalPrice: {
      type: Number,
      default: 0
    },

    // ─── Features and rules ────────────────────────────────────────────
    features: [{
      type: String
    }],
    rules: [{
      type: String
    }],

    // ─── Discounts ─────────────────────────────────────────────────────
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

    // ─── Photos ────────────────────────────────────────────────────────
    photos: [{
      type: String
    }],
    coverImage: [{
      type: String
    }],
    idPhotos: [{
      type: String
    }],

    // ─── Compliance documents ──────────────────────────────────────────
    rcPhotos: [{
      type: String
    }],
    insuranceExpiry: Date,
    pucExpiry: Date,

    // ─── Driver (chauffeur-driven listings) ────────────────────────────
    driverName: String,
    driverPhone: String,
    driverLicenceNumber: String,
    driverLicencePhotos: [{
      type: String
    }],

    // ─── Business details ──────────────────────────────────────────────
    businessName: String,
    businessEmail: String,
    businessPhone: String,
    businessLocality: String,
    gstNumber: String,

    // ─── Status ────────────────────────────────────────────────────────
    status: {
      type: String,
      // 'cancelled' = superseded by a newer submission of the same type. Not a
      // rejection (no admin acted) and not editable, so it stops gating the
      // vendor — see supersedePreviousSubmissions in onboarding.service.js.
      enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
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

module.exports = mongoose.models.VehicleOnboarding || mongoose.model('VehicleOnboarding', VehicleOnboardingSchema);
