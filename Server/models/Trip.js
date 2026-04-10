const mongoose = require('mongoose');
const { Schema } = mongoose;

const TripSchema = new Schema(
  {
    tripId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    destination: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['planned', 'ongoing', 'completed', 'cancelled'],
      default: 'planned'
    },
    description: {
      type: String,
      default: ''
    },
    totalCost: {
      type: Number,
      default: 0
    },
    participants: [{
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' }
    }],
    itinerary: [{
      day: { type: Number, required: true },
      activities: [{ type: String }],
      notes: { type: String, default: '' }
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
// TripSchema.index({ userId: 1 });
// TripSchema.index({ status: 1 });
// TripSchema.index({ startDate: 1 });
// TripSchema.index({ endDate: 1 });

// Ensure end date is after start date
TripSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Trip', TripSchema);