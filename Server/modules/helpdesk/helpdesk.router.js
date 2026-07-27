/**
 * Helpdesk router — mounted at BOTH /api/helpdesk and /api/admin/helpdesk.
 *
 * Auth: every route requires a JWT. The router previously had none, which left
 * /api/helpdesk (the non-admin mount) returning every ticket in the system —
 * names, emails and phone numbers — to anonymous callers, and allowed anyone
 * to edit or delete a ticket by id.
 *
 * The list/read routes take any authenticated user and scope the results to
 * that caller in the service; only an admin sees everything. Mutating another
 * user's ticket stays admin-only.
 */
const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./helpdesk.controller");
const dto = require("./helpdesk.dto");

const router = express.Router();

const requireUser = requireJwt();
const requireAdmin = requireJwt({ adminOnly: true });

router
  .route("/")
  .get(requireUser, validate({ query: dto.listQuery }), controller.list)
  .post(requireUser, validate({ body: dto.ticketBody }), controller.create);

router.patch(
  "/:id/status",
  requireAdmin,
  validate({ params: dto.idParams, body: dto.updateStatusBody }),
  controller.setStatus,
);

router
  .route("/:id")
  .get(requireUser, validate({ params: dto.idParams }), controller.getById)
  .put(requireAdmin, validate({ params: dto.idParams, body: dto.updateBody }), controller.update)
  .delete(requireAdmin, validate({ params: dto.idParams }), controller.remove);

module.exports = router;
