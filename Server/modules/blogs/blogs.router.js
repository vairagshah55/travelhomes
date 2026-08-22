const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./blogs.controller");
const dto = require("./blogs.dto");

const router = express.Router();

// Public reads.
router.get("/", validate({ query: dto.listQuery }), controller.list);

/* Must stay above `/:slug` — the slug pattern is `[a-z0-9-]+`, so it would
   otherwise swallow this path and answer with a 404 for a blog named
   "categories". */
router.get("/categories", validate({ query: dto.categoriesQuery }), controller.categories);

router.get("/:slug", validate({ params: dto.slugParams }), controller.getBySlug);

// Admin-gated writes.
router.post(
  "/",
  requireJwt({ adminOnly: true }),
  validate({ body: dto.createBody }),
  controller.create,
);
router.put(
  "/:id",
  requireJwt({ adminOnly: true }),
  validate({ params: dto.idParams, body: dto.updateBody }),
  controller.update,
);
router.delete(
  "/:id",
  requireJwt({ adminOnly: true }),
  validate({ params: dto.idParams }),
  controller.remove,
);

module.exports = router;
