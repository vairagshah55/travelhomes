/**
 * Admin analytics router. Mounted at /api/admin in api/index.js so the
 * legacy paths `/api/admin/adminAnalytics` and `/api/admin/adminAnalyticsReport`
 * resolve here. (Yes — those are the legacy path names, including the
 * stutter; preserved verbatim.)
 */
const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./admin-analytics.controller");
const dto = require("./admin-analytics.dto");

const router = express.Router();

router.get("/adminAnalytics", controller.getOverview);
router.get("/adminAnalyticsReport", validate({ query: dto.reportQuery }), controller.getReport);

module.exports = router;
