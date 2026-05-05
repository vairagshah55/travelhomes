/**
 * Trips router. Mounted at /api/trips.
 *
 * Static segments (/today, /this-week) declared before the open-ended
 * GET / so Express picks them first.
 */
const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./trips.controller");
const dto = require("./trips.dto");

const router = express.Router();

router.get("/today", controller.listToday);
router.get("/this-week", controller.listEndingThisWeek);

router
  .route("/")
  .get(controller.list)
  .post(validate({ body: dto.createBody }), controller.create);

module.exports = router;
