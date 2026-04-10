const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: '' },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    authorName: { type: String, default: '' },
    authorImg: { type: String, default: '' },
    authorRole: { type: String, default: '' },
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published' },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Blog', BlogSchema);