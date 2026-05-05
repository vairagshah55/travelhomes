/**
 * Calendar-bookings router. Mounted at /api/calendarbooking.
 *
 * Static segments (/resources, /:id/invoice) are declared before /:id so
 * Express matches them first.
 */
const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./calendar-bookings.controller");
const dto = require("./calendar-bookings.dto");

const router = express.Router();

router.get("/resources", controller.resources);

router.get("/:id/invoice", validate({ params: dto.invoiceParams }), controller.buildInvoice);

router.patch(
  "/:id/dates",
  validate({ params: dto.updateDatesParams, body: dto.updateDatesBody }),
  controller.setDates,
);

router.patch(
  "/:id/status",
  validate({ params: dto.updateStatusParams, body: dto.updateStatusBody }),
  controller.setStatus,
);

router
  .route("/")
  .get(validate({ query: dto.listQuery }), controller.list)
  .post(validate({ body: dto.createBody }), controller.create);

router
  .route("/:id")
  .get(validate({ params: dto.getByIdParams }), controller.getById)
  .put(validate({ params: dto.updateParams, body: dto.updateBody }), controller.update)
  .delete(validate({ params: dto.deleteParams }), controller.remove);

module.exports = router;
