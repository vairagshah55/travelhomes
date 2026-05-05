const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./vendors.controller");
const dto = require("./vendors.dto");

const router = express.Router();

// /check needs req.user — register before /:id so the static segment wins.
router.get("/check", requireJwt(), controller.checkVendor);

router
  .route("/")
  .get(validate({ query: dto.listQuery }), controller.list)
  .post(validate({ body: dto.createBody }), controller.create);

router.patch(
  "/:id/status",
  validate({ params: dto.idParams, body: dto.updateStatusBody }),
  controller.setStatus,
);

router
  .route("/:id")
  .get(validate({ params: dto.idParams }), controller.getById)
  .put(validate({ params: dto.idParams, body: dto.updateBody }), controller.update)
  .delete(validate({ params: dto.idParams }), controller.remove);

module.exports = router;
