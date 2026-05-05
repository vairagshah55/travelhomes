const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./plugins.controller");
const dto = require("./plugins.dto");

const router = express.Router();

router
  .route("/")
  .get(validate({ query: dto.listQuery }), controller.list)
  .post(validate({ body: dto.createBody }), controller.create);

router.patch("/:id/toggle", validate({ params: dto.idParams }), controller.toggle);

router.put(
  "/:id/license",
  validate({ params: dto.idParams, body: dto.setLicenseBody }),
  controller.setLicense,
);

router
  .route("/:id")
  .get(validate({ params: dto.idParams }), controller.getById)
  .put(validate({ params: dto.idParams, body: dto.updateBody }), controller.update)
  .delete(validate({ params: dto.idParams }), controller.remove);

module.exports = router;
