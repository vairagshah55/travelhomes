const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Vendor = require('../models/Vendor');
require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', profile.emails[0].value);
        
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Create new user
          const uid = Math.floor(1000000 + Math.random() * 9000000);
          const dummyMobile = `00000${uid}`.slice(-10);
          
          user = new User({
            userId: `AD${uid}`,
            name: profile.displayName,
            email: profile.emails[0].value,
            photo: profile.photos[0]?.value || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            location: 'Not specified',
            phone: dummyMobile,
            status: 'active',
            role: 'user',
            userSince: new Date(),
            uid: uid,
            username: profile.emails[0].value.split('@')[0] + uid,
            mobile: dummyMobile,
            fullname: profile.displayName,
            isActive: true,
            userType: 'user',
            googleId: profile.id
          });

          await user.save();
          console.log('New user created:', user.email);
        } else {
          // Update existing user with Google ID if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
            console.log('Updated user with Google ID:', user.email);
          }
        }

        // Get vendor status if exists
        const vendorDoc = await Vendor.findOne({ email: profile.emails[0].value });
        
        // Convert to object and add vendor status
        const userObj = user.toObject();
        userObj.vendorStatus = vendorDoc?.status;

        return done(null, userObj);
      } catch (error) {
        console.error('Google strategy error:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;