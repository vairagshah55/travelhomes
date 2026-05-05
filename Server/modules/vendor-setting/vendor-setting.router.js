const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./vendor-setting.controller");
const dto = require("./vendor-setting.dto");

const router = express.Router();

router.post("/", validate({ body: dto.createBody }), controller.create);

router.get("/:vendorId", validate({ params: dto.params }), controller.get);

router.put("/:vendorId", validate({ params: dto.params, body: dto.upsertBody }), controller.upsert);

router.patch(
  "/:vendorId/:section",
  validate({ params: dto.sectionParams, body: dto.sectionPatchBody }),
  controller.patchSection,
);

module.exports = router;
