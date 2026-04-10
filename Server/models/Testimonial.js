const mongoose = require('mongoose');
const { Schema } = mongoose;

const TestimonialSchema = new Schema(
  {
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    avatar: { type: String },
    email: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema);
