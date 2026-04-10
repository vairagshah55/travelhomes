const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivitySchema = new Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Activity name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Activity description is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    images: [{
      type: String,
      trim: true
    }],
    regularPrice: {
      type: Number,
      required: [true, 'Regular price is required'],
      min: [0, 'Price cannot be negative']
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative']
    },
    duration: {
      type: String,
      trim: true
    },
    maxParticipants: {
      type: Number,
      min: [1, 'Must allow at least 1 participant']
    },
    minAge: {
      type: Number,
      min: [0, 'Minimum age cannot be negative']
    },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'hard'],
      default: 'moderate'
    },
    included: [{
      type: String,
      trim: true
    }],
    excluded: [{
      type: String,
      trim: true
    }],
    requirements: [{
      type: String,
      trim: true
    }],
    cancellationPolicy: {
      type: String,
      trim: true
    },
    location: {
      address: {
        type: String,
        trim: true
      },
      locality: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
      },
      pincode: {
        type: String,
        trim: true
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    availability: {
      startDate: Date,
      endDate: Date,
      timeSlots: [{
        startTime: String,
        endTime: String,
        maxBookings: Number
      }]
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'archived'],
      default: 'draft'
    },
    featured: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// Create indexes for better performance
ActivitySchema.index({ vendorId: 1 });
ActivitySchema.index({ city: 1, state: 1 });
ActivitySchema.index({ category: 1 });
ActivitySchema.index({ status: 1 });
ActivitySchema.index({ featured: 1 });
ActivitySchema.index({ regularPrice: 1 });
ActivitySchema.index({ 'ratings.average': -1 });

// Text search index
ActivitySchema.index({ 
  name: 'text', 
  description: 'text', 
  category: 'text' 
});

module.exports = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);