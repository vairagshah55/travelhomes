const express = require('express');
const {
  getCalendarBookings,
  getCalendarBookingById,
  createCalendarBooking,
  updateCalendarBooking,
  updateCalendarBookingDates,
  updateCalendarBookingStatus,
  deleteCalendarBooking,
  getResources,
  generateInvoice,
} = require('../controller/calendarBookingController');

const router = express.Router();

/**
 * Calendar Booking Routes
 * Base Path: /api/calendarbooking
 */

// List all calendar bookings (optionally filter by query: year, resource, status, startDate, endDate, limit, page)
router.get('/', getCalendarBookings);

// Get all unique resources with stats
router.get('/resources', getResources);

// Get single calendar booking by ID
router.get('/:id', getCalendarBookingById);

// Create new calendar booking
router.post('/', createCalendarBooking);

// Update entire calendar booking
router.put('/:id', updateCalendarBooking);

// Update booking dates via drag functionality
router.patch('/:id/dates', updateCalendarBookingDates);

// Update booking status only
router.patch('/:id/status', updateCalendarBookingStatus);

// Delete calendar booking
router.delete('/:id', deleteCalendarBooking);

// Generate invoice for booking (optional)
if (typeof generateInvoice === 'function') {
  router.get('/:id/invoice', generateInvoice);
}

module.exports = router;