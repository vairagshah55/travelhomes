// CMSMedia Mongoose Model (cleaned JS, for media uploads, robust for admin/public listing)
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CMSMediaSchema = new Schema(
  {
    page:         { type: String, required: true },    // e.g., "Register/Login"
    section:      { type: String, required: true },    // e.g., "Login Page"
    position:     { type: Number, default: 0 },        // Slot position in UI
    filename:     { type: String, required: true },    // Saved server filename
    url:          { type: String, required: true },    // Public URL for file
    originalName: { type: String },                    // Client file original name
    uploadedAt:   { type: Date, default: Date.now },
    createdAt:    { type: Date, default: Date.now },
    updatedAt:    { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for quick lookup by location in UI/config
CMSMediaSchema.index({ page: 1, section: 1, position: 1 });

CMSMediaSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.CMSMedia || mongoose.model('CMSMedia', CMSMediaSchema);