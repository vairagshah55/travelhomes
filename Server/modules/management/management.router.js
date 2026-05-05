/**
 * Management router. Mounted at both /api/management and /api/admin/management
 * (the SPA uses both paths interchangeably and the admin gate is applied at
 * the parent /api/admin mount).
 */
const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./management.controller");
const dto = require("./management.dto");

const router = express.Router();

router
  .route("/")
  .get(validate({ query: dto.listQuery }), controller.list)
  .post(validate({ body: dto.upsertBody }), controller.create);

router.patch(
  "/:id/status",
  validate({ params: dto.idParams, body: dto.updateStatusBody }),
  controller.setStatus,
);

router
  .route("/:id")
  .get(validate({ params: dto.idParams }), controller.getById)
  .put(validate({ params: dto.idParams, body: dto.upsertBody }), controller.update)
  .delete(validate({ params: dto.idParams }), controller.remove);

module.exports = router;
