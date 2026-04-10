const express = require("express");
const router = express.Router();
const passport = require('passport');
const { signInToken } = require('../config/auth');

const {
  withMobile,
  verifyOtp,
  withEmail,
  signUp,
  signIn,
  deleteusers,
  adminLogin,
  deleteadmins,
  googleAuth
} = require("../controller/Authcontroller");

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'https://travel-f.erpbuz.com'}/login?error=google-auth-failed`,
    session: false
  }),
  (req, res) => {
    try {
      const token = signInToken(req.user);
      const frontendURL = process.env.FRONTEND_URL || "https://travel-f.erpbuz.com";
      res.redirect(`${frontendURL}/oauth-redirect?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || "https://travel-f.erpbuz.com"}/login?error=token-generation-failed`);
    }
  }
);

router.post("/register/mobile", withMobile);
router.post("/register/verifyotp", verifyOtp);
router.post("/register/emailverification", withEmail);
router.post("/register/signup", signUp);
router.post("/login", signIn);
router.post("/adminlogin", adminLogin);
router.post("/google", googleAuth);
router.get("/deleteusers", deleteusers);
router.get("/deleteadmins", deleteadmins);

module.exports = router;