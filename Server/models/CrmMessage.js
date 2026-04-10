const mongoose = require('mongoose');
const { Schema } = mongoose;

const CrmMessageSchema = new Schema({
  targetType: {
    type: String,
    enum: ['Vendor', 'User', 'Staff'],
    required: true,
    index: true
  },
  channels: [{
    type: String,
    enum: ['Email', 'Text', 'Whatsapp']
  }],
  serviceType: {
    type: String,
    enum: ['Caravan', 'Stay', 'Activity', ''],
    default: ''
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['sent', 'queued', 'failed', 'partial'],
    default: 'sent'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminStaff'
  }
}, {
  timestamps: true
});

// Indexes for fast search and filtering
// CrmMessageSchema.index({ targetType: 1, createdAt: -1 });

const CrmMessage = mongoose.models.CrmMessage || mongoose.model('CrmMessage', CrmMessageSchema);

module.exports = CrmMessage;