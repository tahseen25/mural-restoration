/**
 * config/passport.js — Google OAuth 2.0 strategy
 */

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');
const logger = require('../utils/logger');

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google'), null);

      // Upsert: create on first login, update avatar on subsequent logins
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // Check if an account with this email already exists (email/password)
        user = await User.findOne({ email });
        if (user) {
          // Link Google to existing account
          user.googleId = profile.id;
          user.avatar   = user.avatar || profile.photos?.[0]?.value;
        } else {
          // Brand new user
          user = new User({
            googleId:    profile.id,
            email,
            name:        profile.displayName,
            avatar:      profile.photos?.[0]?.value,
            authProvider: 'google',
          });
        }
        await user.save();
        logger.info(`New user registered via Google: ${email}`);
      } else {
        // Update avatar in case it changed
        user.avatar = profile.photos?.[0]?.value || user.avatar;
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      logger.error(`Passport Google strategy error: ${err.message}`);
      return done(err, null);
    }
  }
));

module.exports = passport;
