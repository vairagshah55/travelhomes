const mongoose = require('mongoose');
const { Schema } = mongoose;

const VendorChatMessageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'VendorChatConversation',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'senderKind'
  },
  senderKind: {
    type: String,
    enum: ['Vendor', 'User', 'Register'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  }],
  readBy: [{
    participantId: Schema.Types.ObjectId,
    readAt: { type: Date, default: Date.now }
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date 
}, {
  timestamps: true 
});

// Indexes for better query performance
// VendorChatMessageSchema.index({ conversationId: 1, timestamp: -1 });
// VendorChatMessageSchema.index({ senderId: 1 });
// VendorChatMessageSchema.index({ senderKind: 1 });

module.exports = mongoose.model('VendorChatMessage', VendorChatMessageSchema);