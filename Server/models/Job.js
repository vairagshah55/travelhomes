/**
 * Job Mongoose Model (clean JS, robust for CMS endpoints)
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const JobSchema = new Schema(
  {
    position: { type: String, required: true },     // Job title
    experience: { type: String },                   // "4 Year", "2+ Years" etc.
    location: { type: String },                     // "Remote", "Delhi", etc.
    jd: { type: String, required: true },           // Job description
    isActive: { type: Boolean, default: true },     // For activation/deactivation
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Index for quick active jobs and sorting
// JobSchema.index({ position: 1, isActive: 1 });

// Always update updatedAt
JobSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.Job || mongoose.model('Job', JobSchema);