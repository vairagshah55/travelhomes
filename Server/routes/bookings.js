const express = require('express');
const {
  getBookings,
  getBookingById,
  getBookingsByDate,
  createBooking,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
  updateBookingDates,
  generateInvoice,
  getUserBookings,
} = require('../controller/bookingController');
const { requireJwt } = require('../middleware/auth');

const router = express.Router();

// Standard booking routes
router.get('/', getBookingsByDate);              // GET /api/bookings?date=YYYY-MM-DD
router.post('/', createBooking);                 // POST /api/bookings
router.get('/user/:userId', requireJwt(), getUserBookings); // GET /api/bookings/user/:userId
router.get('/:id', getBookingById);              // GET /api/bookings/:id
router.put('/:id', updateBooking);               // PUT /api/bookings/:id
router.delete('/:id', deleteBooking);            // DELETE /api/bookings/:id

// Booking status PATCH
router.patch('/:id/status', updateBookingStatus);         // PATCH booking status
router.patch('/:id/dates', updateBookingDates);           // PATCH booking dates (calendar drag-drop)

// Optionally: invoice generation endpoint
if (typeof generateInvoice === 'function') {
  router.post('/:id/invoice', generateInvoice);  // POST /api/bookings/:id/invoice
}

// Optional legacy route for compatibility
router.get('/legacy/all', getBookings);

module.exports = router;