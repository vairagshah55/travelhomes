const mongoose = require('mongoose');
const { Schema } = mongoose;

const HomepageSectionSchema = new Schema({
  sectionKey: {
    type: String,
    required: true,
    unique: true,
    enum: ['camper-van', 'unique-stays', 'best-activity', 'trending-destinations', 'testimonials', 'top-rated-stays', 'faq']
  },
  label: {
    type: String,
    required: true
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.HomepageSection || mongoose.model('HomepageSection', HomepageSectionSchema);
