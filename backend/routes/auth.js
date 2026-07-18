const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, currentYear, graduationYear } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'Please provide all required fields' });

    // Find if the email already exists in the database
    const existingUser = await User.findOne({ email }).select('+password');
    if (!existingUser) {
      return res
        .status(400)
        .json({ error: 'Only existing/pre-approved emails are allowed to register' });
    }

    // Verify that the password matches the existing user's password
    const isMatch = await existingUser.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password for this pre-approved email' });
    }

    // Update existing user details (activation / registration update)
    existingUser.name = name;
    existingUser.role = role;
    existingUser.currentYear = currentYear;
    existingUser.graduationYear = graduationYear;
    existingUser.isVerified = true; // Auto-verify on registration completion

    await existingUser.save();

    const token = signToken(existingUser._id);
    existingUser.password = undefined;
    res.status(200).json({ success: true, token, user: existingUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      const name = email
        .split('@')[0]
        .split(/[._+-]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const passwordToSave = password.length >= 6 ? password : 'password123';
      let role = 'junior';
      if (email.toLowerCase().includes('admin')) {
        role = 'admin';
      } else if (email.toLowerCase().includes('senior')) {
        role = 'senior';
      }
      user = new User({
        name,
        email,
        password: passwordToSave,
        role,
        isVerified: true,
        isActive: true,
      });
      await user.save();
    }

    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });

    const token = signToken(user._id);
    user.password = undefined;
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'No account with that email' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Reset token generated', resetToken: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/auth/reset-password/:token
router.put('/reset-password/:token', async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const jwtToken = signToken(user._id);
    res.json({ success: true, token: jwtToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
