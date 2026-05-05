const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./admin-roles.controller");
const dto = require("./admin-roles.dto");

const router = express.Router();

router.get("/features/available", controller.availableFeatures);
router.get("/stats/overview", controller.statsOverview);

router.patch("/:id/toggle", validate({ params: dto.idParams }), controller.toggle);

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
