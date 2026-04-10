// Calendar Booking Mongoose Model (clean JS, no migration junk)
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CalendarBookingSchema = new Schema(
  {
    bookingId: { type: String },
    guestName: { type: String, required: true },
    resourceName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Guest counts
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    totalGuests: { type: Number },

    // Pricing
    basePrice: { type: Number, default: 0 },
    extraCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },

    // Payment details
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'] },
    paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'refunded'], default: 'pending' },
    transactionId: { type: String },
    paidAt: { type: Date },

    // Operational status
    status: { type: String, enum: ['Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'], default: 'Confirmed' },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },

    // Additional info
    notes: { type: String },
    specialRequests: { type: String },
    createdBy: { type: String },

    // Drag & calendar metadata
    lastDraggedAt: { type: Date },
    lastDragAction: { type: String },
    originalDates: {
      startDate: { type: Date },
      endDate: { type: Date }
    },

    color: { type: String },
    vendorId: { type: String },

    // Contact
    phoneNumber: { type: String },
    email: { type: String },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    // Calculated
    totalDays: { type: Number }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// --- VIRTUALS ---
CalendarBookingSchema.virtual('dateRange').get(function () {
  if (!this.startDate || !this.endDate) return '';
  const start = this.startDate.toISOString().slice(0, 10);
  const end = this.endDate.toISOString().slice(0, 10);
  return start === end ? start : `${start} to ${end}`;
});

CalendarBookingSchema.virtual('guestSummary').get(function () {
  const adults = this.adults || 0;
  const children = this.children || 0;
  return `${adults} Adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}`;
});

// --- HOOKS ---
CalendarBookingSchema.pre('validate', function (next) {
  // Generate bookingId if missing
  if (!this.bookingId) {
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    this.bookingId = `CB${randomId}`;
  }
  // Calculate total days
  if (this.startDate && this.endDate) {
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    this.totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }
  // Calculate total guests
  this.totalGuests = (this.adults || 0) + (this.children || 0);

  // Calculate pending amount
  this.pendingAmount = (this.totalAmount || 0) - (this.paidAmount || 0);

  // Color by status
  if (!this.color) {
    switch (this.status) {
      case 'Confirmed': this.color = '#3B82F6'; break; // Blue
      case 'Checked-in': this.color = '#10B981'; break; // Green
      case 'Checked-out': this.color = '#6B7280'; break; // Gray
      case 'Cancelled': this.color = '#EF4444'; break; // Red
      default: this.color = '#3B82F6';
    }
  }

  // Updated timestamp
  this.updatedAt = new Date();

  next();
});

// --- INDEXES ---
// CalendarBookingSchema.index({ startDate: 1, endDate: 1 });
// CalendarBookingSchema.index({ resourceName: 1 });
// CalendarBookingSchema.index({ status: 1 });

// --- EXPORT ---
module.exports = mongoose.models.CalendarBooking || mongoose.model('CalendarBooking', CalendarBookingSchema);