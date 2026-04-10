// SeoSetting Mongoose Model (clean JS, robust for settings/SEO controller)
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SeoSettingSchema = new Schema(
  {
    page: { type: String, required: true, unique: true },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },
    faviconUrl: { type: String },
    logoUrl: { type: String },
    logoDarkUrl: { type: String },
    ogImageUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Always keep updatedAt fresh
SeoSettingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.SeoSetting || mongoose.model('SeoSetting', SeoSettingSchema);