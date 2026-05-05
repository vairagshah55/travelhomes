const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./marketing.controller");
const dto = require("./marketing.dto");

const router = express.Router();

router.get("/content", controller.list);
router.post("/content", validate({ body: dto.createBody }), controller.create);
router.delete("/content/:id", validate({ params: dto.idParams }), controller.remove);

router.post("/post", validate({ body: dto.postBody }), controller.postToSocial);

module.exports = router;
