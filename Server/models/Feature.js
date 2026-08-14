const mongoose = require('mongoose');
const { Schema } = mongoose;

const FeatureSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true
  },
  type: {
    type: String,
    // enum: ['feature', 'category', 'subcategory'],
    default: 'feature'
  },
  status: { 
    type: String, 
    enum: ['enable', 'disable'],
    default: 'enable'
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '' // URL or path to icon
  },
  // Display position in vendor-facing pickers (vehicle types, amenity pills).
  // Lower first; rows without one sort after those with one, by createdAt. Kept
  // separate from createdAt because Mongoose marks createdAt immutable, so a
  // seeded list can't be re-ordered by rewriting timestamps.
  sortOrder: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Add a toJSON transform to map _id to id
FeatureSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.Feature || mongoose.model('Feature', FeatureSchema);
