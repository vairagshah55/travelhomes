/**
 * Offers router. Mounted at /api/offers.
 *
 * Public list/get accept optional auth (the user object is used to scope
 * the query and skip self-tracking) — write/delete/status all require
 * a real JWT.
 */
const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./offers.controller");
const dto = require("./offers.dto");

const router = express.Router();

router.get(
  "/",
  requireJwt({ optional: true }),
  validate({ query: dto.listQuery }),
  controller.list,
);

router.post("/", requireJwt(), validate({ body: dto.upsertBody }), controller.create);

router.get(
  "/:id",
  requireJwt({ optional: true }),
  validate({ params: dto.idParams }),
  controller.getById,
);

router.put(
  "/:id",
  requireJwt(),
  validate({ params: dto.idParams, body: dto.upsertBody }),
  controller.update,
);

router.delete("/:id", requireJwt(), validate({ params: dto.idParams }), controller.remove);

router.patch(
  "/:id/status",
  requireJwt(),
  validate({ params: dto.idParams, body: dto.updateStatusBody }),
  controller.setStatus,
);

router.post(
  "/:id/rate",
  requireJwt(),
  validate({ params: dto.idParams, body: dto.rateBody }),
  controller.rate,
);

router.post("/:id/click", validate({ params: dto.idParams }), controller.trackClick);

module.exports = router;
