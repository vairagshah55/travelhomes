// JobApplication Mongoose Model (cleaned, CMS-compatible, JS/CommonJS)
const mongoose = require('mongoose');
const { Schema } = mongoose;

const JobApplicationSchema = new Schema(
  {
    jobId: { type: String },                              // Application target (Job._id)
    jobTitle: { type: String },                           // Job title string
    fullName: { type: String, required: true },           // Applicant name
    mobile: { type: String },                             // Mobile number
    email: { type: String, required: true },              // Email address
    city: { type: String },
    state: { type: String },
    experience: { type: String },                         // Years/type experience
    linkedin: { type: String },
    referral: { type: String },
    cvUrl: { type: String },                              // Uploaded CV path/url
    status: { 
      type: String, 
      enum: ['Pending', 'Rejected', 'Interview Scheduled', 'Interviewed', 'Accepted', 'Under Review'], 
      default: 'Pending' 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for fast job/application lookups
// JobApplicationSchema.index({ jobId: 1, email: 1 });

JobApplicationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports =
  mongoose.models.JobApplication
    || mongoose.model('JobApplication', JobApplicationSchema);