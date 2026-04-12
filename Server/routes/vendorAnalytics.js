const express = require('express');
const { getVendorAnalyticsCounts, createVendorAnalyticsSnapshot, getLatestVendorAnalyticsSnapshot, getVendorAnalyticsGraphs, resetMetrics } = require('../controller/vendorAnalyticsController');
const { requireJwt } = require('../middleware/auth');
const router = express.Router();
// GET /api/vendorAnalytics - compute and return (JWT optional — scopes to vendor if authenticated)
router.get('/vendorAnalytics', requireJwt({ optional: true }), getVendorAnalyticsCounts);
// GET /api/vendorAnalytics/graphs - compute and return graph data
router.get('/vendorAnalytics/graphs', getVendorAnalyticsGraphs);
// POST /api/vendorAnalytics/snapshot - compute and save to MongoDB
router.post('/vendorAnalytics/snapshot', createVendorAnalyticsSnapshot);
// GET /api/vendorAnalytics/snapshot/latest - fetch the latest saved snapshot
router.get('/vendorAnalytics/snapshot/latest', getLatestVendorAnalyticsSnapshot);
// DELETE /api/vendorAnalytics/reset - clear all impression/click/visitor data
router.delete('/vendorAnalytics/reset', requireJwt(), resetMetrics);
module.exports = router;