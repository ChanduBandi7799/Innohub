const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.send('User already exists');

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ email, name, password: hashed });
  await newUser.save();
  res.redirect('/login');
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login');

    req.logIn(user, (err) => {
      if (err) return next(err);

      // ✅ Set session userId manually here
      req.session.userId = user._id;

      return res.redirect('/home');
    });
  })(req, res, next);
});

// Google OAuth
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
  }),
  (req, res) => {
    // ✅ Set session userId manually here as well
    req.session.userId = req.user._id;
    res.redirect('/home');
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

module.exports = router;
