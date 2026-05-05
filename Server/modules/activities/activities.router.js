/**
 * Activities router. Mounted at /api/activities.
 *
 * GET endpoints are public; everything else requires JWT. /vendor/mine/list
 * has to come before /:id so the path doesn't get matched as an id.
 */
const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./activities.controller");
const dto = require("./activities.dto");

const router = express.Router();

router.get("/vendor/mine/list", requireJwt(), controller.listMine);

router.get("/", validate({ query: dto.listQuery }), controller.list);
router.post("/", requireJwt(), validate({ body: dto.upsertBody }), controller.create);

router.get("/:id", validate({ params: dto.idParams }), controller.getById);
router.put(
  "/:id",
  requireJwt(),
  validate({ params: dto.idParams, body: dto.upsertBody }),
  controller.update,
);
router.patch(
  "/:id/status",
  requireJwt(),
  validate({ params: dto.idParams, body: dto.updateStatusBody }),
  controller.setStatus,
);
router.delete("/:id", requireJwt(), validate({ params: dto.idParams }), controller.remove);

module.exports = router;
