const express = require('express');
const {
  listBookingDetails,
  getBookingDetailByCode,
  createBookingDetail,
  updateBookingDetail,
  deleteBookingDetail,
  generateBookingDetailInvoice,
} = require('../controller/bookingDetailsController');
const { requireJwt } = require('../middleware/auth');

const router = express.Router();

// Public routes (but using optional auth to identify user)
router.get('/', requireJwt({ optional: true }), listBookingDetails);                       // GET all booking details
router.post('/', requireJwt({ optional: true }), createBookingDetail);                     // CREATE booking detail
router.get('/:id', requireJwt({ optional: true }), getBookingDetailByCode);                // GET single booking detail by ID/code
router.put('/:id', requireJwt({ optional: true }), updateBookingDetail);                   // UPDATE booking detail
router.delete('/:id', requireJwt({ optional: true }), deleteBookingDetail);                // DELETE booking detail

// Invoice for a booking detail (if implemented)
if (typeof generateBookingDetailInvoice === 'function') {
  router.post('/:id/invoice', requireJwt({ optional: true }), generateBookingDetailInvoice); // Generate invoice for booking detail
}

module.exports = router;