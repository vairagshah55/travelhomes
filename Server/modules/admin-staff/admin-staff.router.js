const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./admin-staff.controller");
const dto = require("./admin-staff.dto");

const router = express.Router();

// Static segments first.
router.get("/stats/overview", controller.statsOverview);
router.post("/bulk/status", validate({ body: dto.bulkStatusBody }), controller.bulkStatus);

router.patch("/:id/toggle-status", validate({ params: dto.idParams }), controller.toggleStatus);
router.patch("/:id/last-login", validate({ params: dto.idParams }), controller.touchLastLogin);

router
  .route("/")
  .get(validate({ query: dto.listQuery }), controller.list)
  .post(validate({ body: dto.createBody }), controller.create);

router
  .route("/:id")
  .get(validate({ params: dto.idParams }), controller.getById)
  .put(validate({ params: dto.idParams, body: dto.updateBody }), controller.update)
  .delete(validate({ params: dto.idParams }), controller.remove);

module.exports = router;
