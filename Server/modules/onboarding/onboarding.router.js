/**
 * Onboarding router. Mounted at /api/onboarding.
 *
 * Submit endpoints (activity / caravan / stay) are vendor-self-service —
 * any authenticated user can submit. List + get-by-id endpoints are
 * admin-only (the SPA's review queue).
 */
const express = require("express");

const validate = require("../../shared/validate");
const env = require("../../config/env");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./onboarding.controller");
const dto = require("./onboarding.dto");

const router = express.Router();

// ─── Submit ────────────────────────────────────────────────────────────
router.post(
  "/activity",
  requireJwt(),
  validate({ body: dto.submitBody }),
  controller.submitActivity,
);
router.post("/caravan", requireJwt(), validate({ body: dto.submitBody }), controller.submitCaravan);
router.post("/stay", requireJwt(), validate({ body: dto.submitBody }), controller.submitStay);

// ─── Selfie attach ─────────────────────────────────────────────────────
router.post(
  "/activity/selfie",
  requireJwt(),
  validate({ body: dto.selfieBody }),
  controller.attachActivitySelfie,
);
router.post(
  "/caravan/selfie",
  requireJwt(),
  validate({ body: dto.selfieBody }),
  controller.attachCaravanSelfie,
);
router.post(
  "/stay/selfie",
  requireJwt(),
  validate({ body: dto.selfieBody }),
  controller.attachStaySelfie,
);

// ─── Read ──────────────────────────────────────────────────────────────
router.get("/mine", requireJwt(), controller.getMine);

router.get("/activity", requireJwt({ adminOnly: true }), controller.listActivities);
router.get("/caravan", requireJwt({ adminOnly: true }), controller.listCaravans);
router.get("/stay", requireJwt({ adminOnly: true }), controller.listStays);

router.get(
  "/activity/:id",
  requireJwt({ adminOnly: true }),
  validate({ params: dto.idParams }),
  controller.getActivity,
);
router.get(
  "/caravan/:id",
  requireJwt({ adminOnly: true }),
  validate({ params: dto.idParams }),
  controller.getCaravan,
);
router.get(
  "/stay/:id",
  requireJwt({ adminOnly: true }),
  validate({ params: dto.idParams }),
  controller.getStay,
);

// Debug-only count endpoint — same gate as the legacy file.
if (env.NODE_ENV === "development") {
  router.get("/debug/stats", controller.debugStats);
}

module.exports = router;
