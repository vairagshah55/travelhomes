/**
 * Campervans router. Mounted at /api/campervans.
 *
 * Note: legacy router was wide-open (no JWT). Preserving that behavior so
 * the SPA continues to work — admin-side authn happens at /api/admin
 * mounts elsewhere; the public mount remains read-permissive but with
 * the DTO whitelist now blocking arbitrary fields at the edge.
 */
const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./campervans.controller");
const dto = require("./campervans.dto");

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
