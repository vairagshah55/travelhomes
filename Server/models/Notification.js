const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  type: {
    type: String,
    enum: ['vendor_registration', 'new_booking', 'helpdesk_ticket', 'payment_received', 'new_user', 'system_alert', 'service_approval', 'service_rejection', 'job_application'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  referenceModel: {
    type: String,
    required: false,
    // 'Offer' was missing even though offers.service has always referenced
    // listings here — every service approval/rejection bell failed validation
    // and was swallowed by the surrounding catch.
    enum: ['User', 'Vendor', 'Booking', 'HelpDesk', 'Payment', 'Offer']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'vendor', 'user'],
    default: 'admin'
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  }
}, {
  timestamps: true
});

// NotificationSchema.index({ createdAt: -1 });
// NotificationSchema.index({ isRead: 1 });
// NotificationSchema.index({ type: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
