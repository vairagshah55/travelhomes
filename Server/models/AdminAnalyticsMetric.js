const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminAnalyticsMetricSchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ['activity', 'camper-van', 'unique-stay'],
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

const AdminAnalyticsMetric = mongoose.models.AdminAnalyticsMetric || mongoose.model('AdminAnalyticsMetric', AdminAnalyticsMetricSchema);

module.exports = AdminAnalyticsMetric;