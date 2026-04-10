const express = require('express');
const { loginAdmin } = require('../controller/adminAuthController');
const router = express.Router();
// POST /api/login -> delegate to admin login flow (validates against DB only, no creation)
router.post('/login', (req, res) => loginAdmin(req , res));
module.exports = router;