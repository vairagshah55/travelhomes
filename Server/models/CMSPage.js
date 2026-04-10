const mongoose = require('mongoose');
const { Schema } = mongoose;

const CMSPageSchema = new Schema({
  pageKey: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['terms-and-conditions', 'privacy-policy', 'vendor-policy'] 
  },
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    default: '' 
  },
  sections: [{
    heading: { type: String, required: true },
    content: { type: String, required: true }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.CMSPage || mongoose.model('CMSPage', CMSPageSchema);
