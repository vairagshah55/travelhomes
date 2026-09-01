/**
 * Offers router. Mounted at /api/offers.
 *
 * Public list/get accept optional auth (the user object is used to scope
 * the query and skip self-tracking) — write/delete/status all require
 * a real JWT.
 */
const express = require("express");
const rateLimit = require("express-rate-limit");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./offers.controller");
const dto = require("./offers.dto");

const router = express.Router();

// Rate limits on the analytics-fueling endpoints. The listing API fires an
// impression on each public hit and getById fires a visitor count; without a
// cap, a script could trivially inflate vendor metrics. Numbers picked to be
// generous for legitimate UI flows but tight enough to stop bulk abuse.
const listLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 list calls / minute per IP — covers normal browsing + filter toggling
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

const detailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 detail-page opens / minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

const clickLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 clicks / minute per IP — no real user clicks faster than this
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

router.get(
  "/",
  listLimiter,
  requireJwt({ optional: true }),
  validate({ query: dto.listQuery }),
  controller.list,
);

router.post("/", requireJwt(), validate({ body: dto.upsertBody }), controller.create);

/* Ahead of "/:id" — otherwise "compliance" is read as an offer id and rejected
   by the ObjectId check in idParams. */
router.post("/compliance/sweep", requireJwt(), controller.sweepCompliance);

router.get(
  "/:id",
  detailLimiter,
  requireJwt({ optional: true }),
  validate({ params: dto.idParams }),
  controller.getById,
);

router.put(
  "/:id",
  requireJwt(),
  validate({ params: dto.idParams, body: dto.upsertBody }),
  controller.update,
);

router.delete("/:id", requireJwt(), validate({ params: dto.idParams }), controller.remove);

router.patch(
  "/:id/status",
  requireJwt(),
  validate({ params: dto.idParams, body: dto.updateStatusBody }),
  controller.setStatus,
);

/**
 * Renew the insurance / PUC expiry dates on a vehicle listing. Owner or admin.
 * Separate from PUT /:id because it is the one edit that can lift a compliance
 * hold, and it must not drag the listing back through review to do it.
 */
router.patch(
  "/:id/compliance",
  requireJwt(),
  validate({ params: dto.idParams, body: dto.complianceBody }),
  controller.updateCompliance,
);

router.post(
  "/:id/rate",
  requireJwt(),
  validate({ params: dto.idParams, body: dto.rateBody }),
  controller.rate,
);

router.post(
  "/:id/click",
  clickLimiter,
  validate({ params: dto.idParams }),
  controller.trackClick,
);

module.exports = router;
