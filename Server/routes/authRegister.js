const express = require('express');
const {
  registerUserOrVendor,
  updateRegisterDetails,
  verifyRegisterOtp,
  resendRegisterOtp
} = require('../controller/authRegisterController');

const router = express.Router();

// Public registration endpoint
router.post('/auth/register', registerUserOrVendor);

// OTP verification - Updated to match frontend pattern
router.post('/auth/register/:id/verify-otp', verifyRegisterOtp);

// OTP resend - Updated to match frontend pattern  
router.post('/auth/register/:id/resend-otp', resendRegisterOtp);

// Update final registration details (step 3)
router.patch('/auth/register/:id', updateRegisterDetails);

module.exports = router;