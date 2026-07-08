const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const PlacementExp = require('../models/PlacementExp');
const InternshipExp = require('../models/InternshipExp');
const Resource = require('../models/Resource');
const MentorshipRequest = require('../models/MentorshipRequest');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// @route GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users, questions, placements, internships, resources, requests] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      PlacementExp.countDocuments(),
      InternshipExp.countDocuments(),
      Resource.countDocuments(),
      MentorshipRequest.countDocuments({ status: 'accepted' }),
    ]);
    const seniors = await User.countDocuments({ role: 'senior' });
    const juniors = await User.countDocuments({ role: 'junior' });
    res.json({
      success: true,
      stats: {
        users,
        seniors,
        juniors,
        questions,
        placements,
        internships,
        resources,
        activeMentorships: requests,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/admin/users — All users with filters
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search)
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/admin/users/:id/verify — Verify a user
router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/admin/users/:id/toggle — Activate/deactivate user
router.put('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/admin/reported — All reported content
router.get('/reported', async (req, res) => {
  try {
    const [questions, answers, placements, internships, resources] = await Promise.all([
      Question.find({ isReported: true }).populate('author', 'name email'),
      Answer.find({ isReported: true }).populate('author', 'name email'),
      PlacementExp.find({ isReported: true }).populate('author', 'name email'),
      InternshipExp.find({ isReported: true }).populate('author', 'name email'),
      Resource.find({ isReported: true }).populate('uploadedBy', 'name email'),
    ]);
    res.json({
      success: true,
      reported: { questions, answers, placements, internships, resources },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route DELETE /api/admin/content/:type/:id — Remove any content
router.delete('/content/:type/:id', async (req, res) => {
  try {
    const models = {
      question: Question,
      answer: Answer,
      placement: PlacementExp,
      internship: InternshipExp,
      resource: Resource,
    };
    const Model = models[req.params.type];
    if (!Model) return res.status(400).json({ error: 'Invalid content type' });
    await Model.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Content removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/admin/users/:id/role — Change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['junior', 'senior', 'admin'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
