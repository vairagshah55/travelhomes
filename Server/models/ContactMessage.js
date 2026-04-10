// ContactMessage Mongoose Model (cleaned, robust CommonJS)
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContactMessageSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String },
    email:     { type: String, required: true },
    phone:     { type: String },
    message:   { type: String, required: true },
    status:    { type: String, enum: ['unread', 'read'], default: 'unread' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Ensure updatedAt is always refreshed
ContactMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.ContactMessage
  || mongoose.model('ContactMessage', ContactMessageSchema);