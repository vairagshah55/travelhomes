const mongoose = require('mongoose');
const { Schema } = mongoose;

const HelpDeskSchema = new Schema({
  vendorName: {
    type: String,
    trim: true,
  },
  vendorEmail: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'resolved', 'closed', 'Pending', 'Resolved', 'Read'],
    default: 'Pending',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminStaff'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  responses: [
    {
      message: String,
      createdBy: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

// HelpDeskSchema.index({ vendorName: 1, status: 1, createdAt: -1 });

const HelpDesk = mongoose.models.HelpDesk || mongoose.model('HelpDesk', HelpDeskSchema);

module.exports = HelpDesk;