const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./vendor-analytics.controller");
const dto = require("./vendor-analytics.dto");

const router = express.Router();

router.get("/snapshot/latest", controller.getLatestSnapshot);
router.post("/snapshot", controller.createSnapshot);
// requireJwt(optional) so an admin/public hit still works (falls back to
// platform-wide totals) but a logged-in vendor sees their own series only.
router.get(
  "/graphs",
  requireJwt({ optional: true }),
  validate({ query: dto.graphsQuery }),
  controller.getGraphs,
);
// Admin-only — this endpoint wipes platform-wide impressions, visitors, and
// click counters. Was previously open to any vendor JWT, which meant a leaked
// vendor token could nuke everyone's analytics. The CLI fallback at
// `Server/scripts/reset-impressions.js` remains available for local dev.
router.delete("/reset", requireJwt({ adminOnly: true }), controller.resetMetrics);

router.get("/", requireJwt({ optional: true }), controller.getCounts);

module.exports = router;
