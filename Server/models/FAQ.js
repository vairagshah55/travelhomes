// FAQ Mongoose Model (cleaned JS/Node, robust for CMS/public filtering)
const mongoose = require('mongoose');
const { Schema } = mongoose;

const FaqSchema = new Schema(
  {
    category: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Index for category and active
// FaqSchema.index({ category: 1, isActive: 1 });

// Auto-update updatedAt on save
FaqSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.Faq || mongoose.model('Faq', FaqSchema);