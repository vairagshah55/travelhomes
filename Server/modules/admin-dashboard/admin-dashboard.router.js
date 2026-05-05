/**
 * Admin dashboard router.
 *
 * Mounted at /api in api/index.js so the legacy path
 * `/api/admin/dashboard` resolves to `controller.getStats` here.
 */
const express = require("express");
const controller = require("./admin-dashboard.controller");

const router = express.Router();

router.get("/admin/dashboard", controller.getStats);

module.exports = router;
