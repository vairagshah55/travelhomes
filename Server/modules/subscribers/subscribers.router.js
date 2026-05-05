/**
 * Subscribers router. Mounted at /api/subscribers.
 *
 * `GET /` is public today (matches legacy). The list endpoint exposes every
 * email address — should be admin-gated. Hardening is part of the Phase 4
 * RBAC sweep.
 */
const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./subscribers.controller");
const dto = require("./subscribers.dto");

const router = express.Router();

router
  .route("/")
  .post(validate({ body: dto.subscribeBody }), controller.subscribe)
  .get(controller.list);

module.exports = router;
