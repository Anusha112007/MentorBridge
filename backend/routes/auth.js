const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'mentorbridge_jwt_secret_key_2026_x9k2';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT
const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, branch, currentYear, graduationYear } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if the user already exists in the database
    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (user) {
      // If the email is already registered and verified, block it
      if (user.isVerified) {
        return res.status(400).json({ error: 'Email is already registered. Please login.' });
      }

      // If it exists but is not verified (pre-approved/seeded email):
      // Update details and set the new password
      user.name = name.trim();
      user.password = password; // this will be hashed by the pre-save hook
      user.role = role;
      if (branch) user.branch = branch.trim();
      if (currentYear) user.currentYear = currentYear;
      if (graduationYear) user.graduationYear = graduationYear;
      user.isVerified = true;
      user.isActive = true;
      await user.save();
    } else {
      // Create a brand new user
      user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
        branch: branch ? branch.trim() : undefined,
        currentYear,
        graduationYear,
        isVerified: true,
        isActive: true,
      });
      await user.save();
    }

    const token = signToken(user._id);
    user.password = undefined;
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify that the password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

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
    if (!req.body.email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const normalizedEmail = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'No account with that email' });
    }

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
