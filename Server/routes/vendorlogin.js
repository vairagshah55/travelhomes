const express = require('express');
const { vendorLogin, forgotPassword, verifyOtp, resetPassword, updateAccount, sendChangeOtp } = require('../controller/vendorLoginController');
const router = express.Router();
// Vendor auth routes
router.post('/vendorlogin/login', vendorLogin);
router.post('/vendorlogin/forgot', forgotPassword);
router.post('/vendorlogin/verify-otp', verifyOtp);
router.post('/vendorlogin/reset', resetPassword);
router.post('/vendorlogin/update-account', updateAccount);
router.post('/vendorlogin/send-change-otp', sendChangeOtp);
module.exports = router;