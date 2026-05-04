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
const { loginAdmin, loginAdmins, getMe } = require('../controller/adminAuthController');
const { requireJwt } = require('../middleware/auth');
const router = express.Router();

// Public
router.post('/login', loginAdmins);           // AdminStaff login (primary)
router.post('/login/superadmin', loginAdmin); // Admin (superadmin) login

// Superadmin bootstrap is intentionally NOT exposed over HTTP.
// To create a superadmin, run: `node Server/create-admin.js` with shell access.

// Protected
router.get('/me', requireJwt({ adminOnly: true }), getMe);

module.exports = router;
