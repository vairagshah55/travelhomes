const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentSchema = new Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  personName: {
    type: String,
    required: true,
    trim: true
  },
  servicesNames: {
    type: [String],
    required: true
  },
  serviceCategory: {
    type: String,
    enum: ['activity', 'camper-van', 'unique-stay'],
    required: true
  },
  bookingId: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Management',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'razorpay'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled', 'paid', 'requested', 'processing'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  refundAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  refundDate: {
    type: Date
  },
  refundReason: {
    type: String,
    trim: true
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'razorpay', 'square', 'manual'],
    default: 'stripe'
  },
  gatewayTransactionId: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Convert servicesNames array to comma-separated string
      if (Array.isArray(ret.servicesNames)) {
        ret.servicesNames = ret.servicesNames.join(', ');
      }
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Convert servicesNames array to comma-separated string
      if (Array.isArray(ret.servicesNames)) {
        ret.servicesNames = ret.servicesNames.join(', ');
      }
      return ret;
    }
  }
});

// Virtual fields for admin panel compatibility
PaymentSchema.virtual('paymentId').get(function() {
  return this.transactionId || this._id.toString();
});

PaymentSchema.virtual('servicesId').get(function() {
  return this.serviceId?.toString() || '';
});

PaymentSchema.virtual('paymentMode').get(function() {
  return this.paymentMethod;
});

// Add indexes for better query performance
// PaymentSchema.index({ bookingId: 1 });
// PaymentSchema.index({ userId: 1 });
// PaymentSchema.index({ serviceId: 1 });
// PaymentSchema.index({ status: 1 });
// PaymentSchema.index({ serviceCategory: 1, status: 1 });
// PaymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

module.exports = Payment;