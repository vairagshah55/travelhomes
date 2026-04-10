const mongoose = require('mongoose');

const MarketingContentSchema = new mongoose.Schema({
  images: {
    type: [String],
    default: []
  },
  content: {
    type: String,
    default: ''
  },
  additionalCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // adds createdAt, updatedAt
});

module.exports = mongoose.model('MarketingContent', MarketingContentSchema);