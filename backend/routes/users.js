const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route GET /api/users/seniors — Search seniors with filters
router.get('/seniors', protect, async (req, res) => {
  try {
    const { branch, skills, domain, company, batch, search, page = 1, limit = 12 } = req.query;
    const query = { role: 'senior', isActive: true };

    if (branch) query.branch = { $regex: branch, $options: 'i' };
    if (company) query.placementCompany = { $regex: company, $options: 'i' };
    if (batch) query.graduationYear = Number(batch);
    if (skills) query.skills = { $in: skills.split(',').map((s) => new RegExp(s.trim(), 'i')) };
    if (domain) query.areasOfExpertise = { $in: [new RegExp(domain, 'i')] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
        { areasOfExpertise: { $in: [new RegExp(search, 'i')] } },
        { placementCompany: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const seniors = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), seniors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/users — Search all active users
router.get('/', protect, async (req, res) => {
  try {
    const { search, role, limit = 10 } = req.query;
    const query = { _id: { $ne: req.user._id }, isActive: true };

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { branch: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('name role branch profilePicture availabilityStatus currentYear graduationYear')
      .limit(Number(limit));

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/users/me
router.get('/me', protect, (req, res) => res.json({ success: true, user: req.user }));

// @route PUT /api/users/me — Update own profile
router.put('/me', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.profilePicture = `/uploads/${req.file.filename}`;
    if (updates.skills && typeof updates.skills === 'string')
      updates.skills = updates.skills.split(',').map((s) => s.trim());
    if (updates.areasOfExpertise && typeof updates.areasOfExpertise === 'string')
      updates.areasOfExpertise = updates.areasOfExpertise.split(',').map((s) => s.trim());
    if (updates.interests && typeof updates.interests === 'string')
      updates.interests = updates.interests.split(',').map((s) => s.trim());

    delete updates.password;
    delete updates.role;
    delete updates.email;
    updates.branch = 'CSE';

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/users/juniors — Search juniors with filters
router.get('/juniors', protect, async (req, res) => {
  try {
    const { branch, skills, interest, year, search, page = 1, limit = 12 } = req.query;
    const query = { role: 'junior', isActive: true };

    if (branch) query.branch = { $regex: branch, $options: 'i' };
    if (year) query.currentYear = Number(year);
    if (skills) query.skills = { $in: skills.split(',').map((s) => new RegExp(s.trim(), 'i')) };
    if (interest) query.interests = { $in: [new RegExp(interest, 'i')] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
        { interests: { $in: [new RegExp(search, 'i')] } },
        { branch: { $regex: search, $options: 'i' } },
        { careerGoals: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const juniors = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), juniors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/users/:id — Get any public profile
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -resetPasswordToken -resetPasswordExpire'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
