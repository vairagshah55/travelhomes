const mongoose = require('mongoose');
const { Schema } = mongoose;

const VendorAnalyticsSnapshotSchema = new Schema({
  total: { type: Number, default: 0 },
  upcoming: { type: Number, default: 0 },
  past: { type: Number, default: 0 },
  cancelled: { type: Number, default: 0 },
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
  },
  payments: {
    received: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },
  properties: {
    approved: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },
  computedAt: { 
    type: Date, 
    default: () => new Date(), 
    index: true 
  }
}, { 
  timestamps: true 
});

// Index for better query performance
// VendorAnalyticsSnapshotSchema.index({ computedAt: -1 });

module.exports = mongoose.model('VendorAnalyticsSnapshot', VendorAnalyticsSnapshotSchema);