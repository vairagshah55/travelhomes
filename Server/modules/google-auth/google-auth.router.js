/**
 * Google OAuth router. Mounted at /api/auth.
 *
 * This is the only auth flow we don't drive through dto+service+controller —
 * the request lifecycle is owned by passport's redirect-based middleware
 * chain, and there's no client-supplied JSON body to validate. The
 * passport strategy itself is configured globally in config/passport.js.
 *
 * GET /auth/google           — start the OAuth handshake
 * GET /auth/google/callback  — receive the code, sign a JWT, redirect
 *                              back to the SPA at /oauth-redirect with
 *                              ?token=&user= query params
 */
const express = require("express");
const passport = require("passport");

const env = require("../../config/env");
const { signInToken } = require("../../config/auth");
const logger = require("../../shared/logger");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${env.FRONTEND_URL}/login?error=google-auth-failed`,
    session: false,
  }),
  (req, res) => {
    try {
      const token = signInToken(req.user);
      const userJson = encodeURIComponent(JSON.stringify(req.user));
      res.redirect(`${env.FRONTEND_URL}/oauth-redirect?token=${token}&user=${userJson}`);
    } catch (err) {
      logger.error({ err }, "[GoogleAuth] token generation failed");
      res.redirect(`${env.FRONTEND_URL}/login?error=token-generation-failed`);
    }
  },
);

module.exports = router;
