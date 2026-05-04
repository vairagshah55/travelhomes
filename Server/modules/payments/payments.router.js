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
const controller = require("./payments.controller");
const dto = require("./payments.dto");

const router = express.Router();

router
  .route("/")
  .get(requireJwt({ optional: true }), validate({ query: dto.listQuery }), controller.list)
  .post(validate({ body: dto.createPaymentBody }), controller.create);

// Razorpay routes are static-prefix + must be declared BEFORE `/:id`
// otherwise Express matches `razor` as an id.
router.post("/razor/create-order", validate({ body: dto.createOrderBody }), controller.createOrder);
router.post(
  "/razor/verify-payment",
  validate({ body: dto.verifyPaymentBody }),
  controller.verifyPayment,
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
