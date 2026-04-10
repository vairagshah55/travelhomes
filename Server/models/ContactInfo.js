const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContactInfoSchema = new Schema({
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  image: { type: String, default: '' }, // URL to hero image
  mapUrl: { type: String, default: '' },
  socials: { 
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true,
  // Ensure we only have one document (singleton pattern via logic, or just always fetch first)
});

module.exports = mongoose.models.ContactInfo || mongoose.model('ContactInfo', ContactInfoSchema);
