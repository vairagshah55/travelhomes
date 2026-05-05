/**
 * Contact router. Mounted at /api/contact (public submit) and
 * /api/admin/contact (admin-gated by api/index.js's /api/admin requireJwt).
 */
const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./contact.controller");
const dto = require("./contact.dto");

const router = express.Router();

router
  .route("/")
  .post(validate({ body: dto.submitBody }), controller.submit)
  .get(controller.list);

router.patch("/read/:id", validate({ params: dto.markReadParams }), controller.markRead);

router.post(
  "/reply/:id",
  validate({ params: dto.replyParams, body: dto.replyBody }),
  controller.reply,
);

router.delete("/:id", validate({ params: dto.deleteParams }), controller.remove);

module.exports = router;
