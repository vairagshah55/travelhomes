const express = require('express');
const { getAdminAnalyticsOverview, getAdminAnalyticsReport } = require('../controller/adminAnalyticsController');

const router = express.Router();

// Admin analytics routes (preserving original naming including typos)
router.get('/adminAnalytics', getAdminAnalyticsOverview);
router.get('/adminAnalyticsReport', getAdminAnalyticsReport);

module.exports = router;