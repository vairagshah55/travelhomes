const express = require("express");

const validate = require("../../shared/validate");
const controller = require("./admin-crm.controller");
const dto = require("./admin-crm.dto");

const router = express.Router();

router.post("/send", validate({ body: dto.sendBody }), controller.send);
router.get("/messages", validate({ query: dto.listQuery }), controller.list);
router.delete("/messages/:id", validate({ params: dto.idParams }), controller.remove);

module.exports = router;
