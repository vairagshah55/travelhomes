const express = require('express');
const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  updatePaymentStatus,
  razorPaymentCreateOrder,
  razorPaymentVerify
} = require('../controller/paymentController');
const { requireJwt } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(requireJwt({ optional: true }), getPayments)
  .post(createPayment);

router.route('/:id')
  .get(requireJwt({ optional: true }), getPayment)
  .put(requireJwt({ optional: true }), updatePayment)
  .delete(requireJwt({ optional: true }), deletePayment);

router.post('/razor/create-order', razorPaymentCreateOrder);
router.post('/razor/verify-payment', razorPaymentVerify);

router.patch('/:id/status', requireJwt({ optional: true }), updatePaymentStatus);

module.exports = router;