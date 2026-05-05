const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./vendor-analytics.controller");
const dto = require("./vendor-analytics.dto");

const router = express.Router();

router.get("/snapshot/latest", controller.getLatestSnapshot);
router.post("/snapshot", controller.createSnapshot);
router.get("/graphs", validate({ query: dto.graphsQuery }), controller.getGraphs);
router.delete("/reset", requireJwt(), controller.resetMetrics);

router.get("/", requireJwt({ optional: true }), controller.getCounts);

module.exports = router;
