// const express = require('express');
// const { loginAdmin, getMe } = require('../controller/adminAuthController');
// const { requireJwt } = require('../middleware/auth');
// const router = express.Router();

// // Public
// router.post('/admin/auth/login', loginAdmin);

// // Protected
// router.get('/admin/auth/me', requireJwt({ adminOnly: true }), getMe);

// module.exports = router;


// routes/adminAuth.js
const express = require('express');
const { loginAdmin, registerAdmin, getMe } = require('../controller/adminAuthController');
const { requireJwt } = require('../middleware/auth');
const router = express.Router();

// Public
router.post('/login', loginAdmin);
router.post('/register', registerAdmin);

// Protected
router.get('/me', requireJwt({ adminOnly: true }), getMe);

module.exports = router;
