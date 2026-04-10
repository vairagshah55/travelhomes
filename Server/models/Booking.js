const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExtraItemSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
});

const PaymentDetailsSchema = new Schema({
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
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  }
});

const BookingSchema = new Schema({
  bookingId: {
    type: String,
    unique: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'serviceModel',
    required: true
  },
  serviceModel: {
    type: String,
    required: true,
    enum: ['Management', 'Offer'],
    default: 'Management'
  },
  serviceName: {
    type: String,
    required: true,
    enum: ['activity', 'camper-van', 'unique-stay'],
    trim: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  clientPhone: {
    type: String,
    trim: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    type: String,
    trim: true
  },
  pickupLocation: {
    type: String,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  baseAmount: {
    type: Number,
    required: true,
    min: 0
  },
  extraItems: [ExtraItemSchema],
  paymentDetails: PaymentDetailsSchema,
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'checked-in', 'checked-out', 'active'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    trim: true
  },
  confirmationSent: {
    type: Boolean,
    default: false
  },
  confirmationSentAt: {
    type: Date
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoicePath: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for admin panel compatibility
BookingSchema.virtual('checkIn').get(function() {
  return this.checkInDate;
});

BookingSchema.virtual('checkOut').get(function() {
  return this.checkOutDate;
});

BookingSchema.virtual('guests').get(function() {
  return this.numberOfGuests;
});

BookingSchema.virtual('status').get(function() {
  return this.bookingStatus;
});

BookingSchema.virtual('paymentStatus').get(function() {
  return this.paymentDetails?.paymentStatus || 'pending';
});

BookingSchema.virtual('serviceType').get(function() {
  return this.serviceName;
});

// Auto-generate a bookingId if not provided
BookingSchema.pre('validate', function (next) {
  if (!this.bookingId) {
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    this.bookingId = `BK${randomId}`;
  }
  next();
});

// Add indexes for better query performance
// BookingSchema.index({ userId: 1 });
// BookingSchema.index({ serviceId: 1 });
// BookingSchema.index({ bookingStatus: 1 });
// BookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
// BookingSchema.index({ createdAt: -1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

module.exports = Booking;