const express = require('express');
const { getVendorAnalyticsCounts, createVendorAnalyticsSnapshot, getLatestVendorAnalyticsSnapshot, getVendorAnalyticsGraphs } = require('../controller/vendorAnalyticsController');
const router = express.Router();
// GET /api/vendorAnalytics - compute and return
router.get('/vendorAnalytics', getVendorAnalyticsCounts);
// GET /api/vendorAnalytics/graphs - compute and return graph data
router.get('/vendorAnalytics/graphs', getVendorAnalyticsGraphs);
// POST /api/vendorAnalytics/snapshot - compute and save to MongoDB
router.post('/vendorAnalytics/snapshot', createVendorAnalyticsSnapshot);
// GET /api/vendorAnalytics/snapshot/latest - fetch the latest saved snapshot
router.get('/vendorAnalytics/snapshot/latest', getLatestVendorAnalyticsSnapshot);
module.exports = router;