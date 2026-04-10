  // const express = require('express');
  // const passport = require('passport');
  // const router = express.Router();
  // const { signInToken } = require('../config/auth');

  // // Initiate Google OAuth
  // router.get('/auth/google',
  //   passport.authenticate('google', { 
  //     scope: ['profile', 'email'],
  //     prompt: 'select_account'
  //   })
  // );

  // // Google OAuth callback
  // router.get('/auth/google/callback',
  //   passport.authenticate('google', { 
  //     failureRedirect: `${process.env.FRONTEND_URL ||"https://travel-f.erpbuz.com" || 'http://localhost:8080'}/login?error=google-auth-failed`,
  //     session: false
  //   }),
  //   (req, res) => {
  //     try {
  //       // Generate JWT token
  //       const token = signInToken(req.user);
        
  //       // Redirect to frontend with token
  //       const frontendURL = process.env.FRONTEND_URL || "https://travel-f.erpbuz.com" || 'http://localhost:8080' ;
  //       // Use the standard callback path but with token instead of code
  //       res.redirect(`${frontendURL}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  //     } catch (error) {
  //       console.error('Google callback error:', error);
  //       res.redirect(`${process.env.FRONTEND_URL || "https://travel-f.erpbuz.com" || 'http://localhost:8080'}/login?error=token-generation-failed`);
  //     }
  //   }
  // );

  // module.exports = router;


  const express = require("express");
const passport = require("passport");
const router = express.Router();
const { signInToken } = require("../config/auth");

// Start Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// Google OAuth callback
router.get('/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'https://travel-f.erpbuz.com'}/login?error=google-auth-failed`,
    session: false
  }),
  (req, res) => {
    try {
      const token = signInToken(req.user);
      
      // Redirect to frontend with token
      const frontendURL = process.env.FRONTEND_URL || "https://travel-f.erpbuz.com";
      // Use the standard callback path but with token instead of code
      res.redirect(`${frontendURL}/oauth-redirect?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || "https://travel-f.erpbuz.com"}/login?error=token-generation-failed`);
    }
  }
);

module.exports = router;