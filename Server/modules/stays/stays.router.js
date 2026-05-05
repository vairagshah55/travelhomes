/**
 * Stays router. Mounted at /api/stays. Public (matches the legacy file).
 */
const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./stays.controller");
const dto = require("./stays.dto");

const router = express.Router();

router
  .route("/")
  .get(validate({ query: dto.listQuery }), controller.list)
  .post(validate({ body: dto.upsertBody }), controller.create);

router
  .route("/:id")
  .get(validate({ params: dto.idParams }), controller.getById)
  .put(validate({ params: dto.idParams, body: dto.upsertBody }), controller.update)
  .delete(validate({ params: dto.idParams }), controller.remove);

module.exports = router;
