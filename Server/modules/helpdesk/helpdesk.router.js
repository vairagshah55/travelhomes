const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./helpdesk.controller");
const dto = require("./helpdesk.dto");

const router = express.Router();

router
  .route("/")
  .get(validate({ query: dto.listQuery }), controller.list)
  .post(validate({ body: dto.ticketBody }), controller.create);

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
