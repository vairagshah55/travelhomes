/**
 * Payments router. Mounted at /api/payments and /api/admin/payments.
 *
 * Auth model preserved from the legacy router:
 *   - Most CRUD endpoints use `requireJwt({ optional: true })` so they
 *     populate req.user when a token is present but don't fail when it's
 *     absent. The list/get controllers themselves enforce auth.
 *   - Razorpay order + verify endpoints are public (the SPA hits them
 *     without an auth token; the verify endpoint checks the HMAC signature
 *     instead).
 */
const express = require("express");

const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const { requireFeature } = require("../../middleware/permissions");
const controller = require("./payments.controller");
const dto = require("./payments.dto");

const router = express.Router();

router
  .route("/")
  .get(requireJwt({ optional: true }), validate({ query: dto.listQuery }), controller.list)
  .post(validate({ body: dto.createPaymentBody }), controller.create);

// Gateway routes are static-prefix + must be declared BEFORE `/:id`
// otherwise Express matches `razor` / `cashfree` / `gateway` as an id.

// Which checkout the SPA should load. Public and credential-free by design —
// it returns Razorpay's public key id at most, never a secret.
router.get("/gateway", controller.getGateway);

// Admin gateway selection.
//
// This router is mounted twice — publicly at /api/payments and behind
// requireJwt at /api/admin/payments — so these two routes carry their own
// guard rather than relying on the mount. `requireFeature` resolves the acting
// staff member from req.user, which the public mount never populates, so an
// unauthenticated caller on /api/payments/gateway/settings gets a 401.
const adminOnly = [requireJwt({ optional: true }), requireFeature("manage_payments")];

router.get("/gateway/settings", ...adminOnly, controller.getGatewaySettings);
router.put(
  "/gateway/settings",
  ...adminOnly,
  validate({ body: dto.updateGatewayBody }),
  controller.updateGateway,
);

router.post("/razor/create-order", validate({ body: dto.createOrderBody }), controller.createOrder);
router.post(
  "/razor/verify-payment",
  validate({ body: dto.verifyPaymentBody }),
  controller.verifyPayment,
);

router.post(
  "/cashfree/create-order",
  validate({ body: dto.createCashfreeOrderBody }),
  controller.createCashfreeOrder,
);
router.post(
  "/cashfree/verify-payment",
  validate({ body: dto.verifyCashfreePaymentBody }),
  controller.verifyCashfreePayment,
);

router.patch(
  "/:id/status",
  requireJwt({ optional: true }),
  validate({ params: dto.updateStatusParams, body: dto.updateStatusBody }),
  controller.setStatus,
);

router
  .route("/:id")
  .get(requireJwt({ optional: true }), validate({ params: dto.getByIdParams }), controller.getById)
  .put(
    requireJwt({ optional: true }),
    validate({ params: dto.updatePaymentParams, body: dto.updatePaymentBody }),
    controller.update,
  )
  .delete(
    requireJwt({ optional: true }),
    validate({ params: dto.deletePaymentParams }),
    controller.remove,
  );

module.exports = router;
