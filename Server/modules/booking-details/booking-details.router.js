/**
 * Booking-details router — mounted at /api/bookingDetails.
 *
 * Auth: legacy `requireJwt({ optional: true })` is kept on every route — the
 * list controller enforces auth itself (returns 401 when req.user is missing).
 */
const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./booking-details.controller");
const dto = require("./booking-details.dto");

const router = express.Router();

router
  .route("/")
  .get(requireJwt({ optional: true }), validate({ query: dto.listQuery }), controller.list)
  .post(requireJwt({ optional: true }), validate({ body: dto.createBody }), controller.create);

router.post(
  "/:id/invoice",
  requireJwt({ optional: true }),
  validate({ params: dto.invoiceParams }),
  controller.buildInvoice,
);

router
  .route("/:id")
  .get(
    requireJwt({ optional: true }),
    validate({ params: dto.getByIdParams, query: dto.getByIdQuery }),
    controller.getById,
  )
  .put(
    requireJwt({ optional: true }),
    validate({ params: dto.updateParams, body: dto.updateBody }),
    controller.update,
  )
  .delete(
    requireJwt({ optional: true }),
    validate({ params: dto.deleteParams }),
    controller.remove,
  );

module.exports = router;
