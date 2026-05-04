/**
 * Admin-auth router. Mounted at /api/admin/auth from api/index.js.
 *
 * The login routes are public; only /me requires a JWT.
 *
 * NOTE: api/index.js applies `requireJwt({ adminOnly: true })` to `/api/admin`
 * AFTER this mount, so these public login routes are unaffected by that gate.
 * /me declares its own requireJwt middleware here for clarity.
 */
const express = require("express");
const rateLimit = require("express-rate-limit");

const env = require("../../config/env");
const validate = require("../../shared/validate");
const { requireJwt } = require("../../middleware/auth");
const controller = require("./admin-auth.controller");
const dto = require("./admin-auth.dto");

const router = express.Router();

// Per-IP brute-force protection on credential endpoints.
const authLimiter =
  env.NODE_ENV === "test"
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please try again later.",
          },
        },
      });

// POST /api/admin/auth/login — AdminStaff login (primary).
router.post("/login", authLimiter, validate({ body: dto.loginBody }), controller.loginStaff);

// POST /api/admin/auth/login/superadmin — legacy superadmin Admin login.
router.post(
  "/login/superadmin",
  authLimiter,
  validate({ body: dto.loginBody }),
  controller.loginSuperadmin,
);

// GET /api/admin/auth/me — current admin info from JWT.
router.get("/me", requireJwt({ adminOnly: true }), controller.getMe);

module.exports = router;
