const express = require('express');
const { getAdminDashboard } = require('..\/controller\/adminDashboardController');
const router = express.Router();

// GET /api/admin/dashboard
router.get('/admin/dashboard', getAdminDashboard);

module.exports = router;