const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminAnalyticsMetricSchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ['activity', 'camper-van', 'unique-stay', 'listing'],
    index: true
  },
  impressions: {
    type: Number,
    default: 0,
    min: 0
  },
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
  // Track unique visitor IDs per day to avoid double-counting
  visitorIds: {
    type: [String],
    default: []
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Management'
  },
  metricDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
AdminAnalyticsMetricSchema.index({ category: 1, metricDate: -1 });
AdminAnalyticsMetricSchema.index({ serviceId: 1 });

// Unique compound index — ensures one row per (offer, day, category) tuple.
// Without this, two concurrent upserts at the exact same moment could create
// duplicate metric rows that quietly diverge. With this index in place, the
// second upsert fails with a duplicate-key error (11000) which the impression
// tracker treats as a dedupe-success no-op.
AdminAnalyticsMetricSchema.index(
  { serviceId: 1, metricDate: 1, category: 1 },
  { unique: true, sparse: true, name: "uniq_serviceId_metricDate_category" },
);

const AdminAnalyticsMetric = mongoose.models.AdminAnalyticsMetric || mongoose.model('AdminAnalyticsMetric', AdminAnalyticsMetricSchema);

module.exports = AdminAnalyticsMetric;