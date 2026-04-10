const mongoose = require('mongoose');

const BookingDetailSchema = new mongoose.Schema({
  clientName:     { type: String, required: true },
  serviceName:    { type: String, required: true },
  servicePrice:   { type: Number, required: true },
  checkIn:        { type: Date, required: false },
  checkOut:       { type: Date, required: false },
  guests:         { type: Number, default: 1 },
  status:         { type: String, enum: ['pending', 'confirmed', 'active', 'cancelled'], required: true },
  statusColor:    { type: String, default: '' },
  location:       { type: String, default: '' },
  contactEmail:   { type: String, default: '' },
  contactPhone:   { type: String, default: '' },
  pickupLocation: { type: String, default: '' },
  vendorId:       { type: String},
  id:             { type: String, unique: true, sparse: true }, // if used as human-friendly code/ID
}, { timestamps: true });

module.exports = mongoose.model('BookingDetail', BookingDetailSchema);