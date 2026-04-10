const mongoose = require('mongoose');
const { Schema } = mongoose;

const ParticipantSchema = new Schema({
  kind: {
    type: String,
    enum: ['Vendor', 'User', 'Register'],
    required: true
  },
  refId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'kind'
  }
});

const VendorChatConversationSchema = new Schema({
  participants: {
    type: [ParticipantSchema],
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length >= 2;
      },
      message: 'Conversation must have at least 2 participants'
    }
  },
  isGroup: { 
    type: Boolean, 
    default: false 
  },
  title: { 
    type: String, 
    default: '' 
  },
  lastMessage: { 
    type: String, 
    default: '' 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now 
  },
  unreadCounts: { 
    type: Schema.Types.Mixed, 
    default: {} 
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
// VendorChatConversationSchema.index({ 'participants.kind': 1, 'participants.refId': 1 });
// VendorChatConversationSchema.index({ lastActivity: -1 });
// VendorChatConversationSchema.index({ isGroup: 1 });

module.exports = mongoose.model('VendorChatConversation', VendorChatConversationSchema);