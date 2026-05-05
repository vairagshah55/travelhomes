/**
 * Notifications router. Mounted at /api/notifications and
 * /api/admin/notifications (the latter is gated by api/index.js's
 * /api/admin requireJwt).
 *
 * Every endpoint requires a JWT — controller-level scoping then either
 * pins the query to req.user.id or admits unrestricted admin access.
 */
const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./notifications.controller");
const dto = require("./notifications.dto");

const router = express.Router();

router.use(requireJwt());

router.get("/", validate({ query: dto.listQuery }), controller.list);

router.put("/read-all", controller.markAllRead);

router.post("/bulk-delete", validate({ body: dto.bulkDeleteBody }), controller.bulkDelete);

router.put("/:id/read", validate({ params: dto.idParams }), controller.markRead);

router.delete("/:id", validate({ params: dto.idParams }), controller.remove);

module.exports = router;
