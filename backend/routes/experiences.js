const express = require('express');
const router = express.Router();
const PlacementExp = require('../models/PlacementExp');
const InternshipExp = require('../models/InternshipExp');
const { protect } = require('../middleware/auth');

// ========== PLACEMENT EXPERIENCES ==========

// @route GET /api/experiences/placement
router.get('/placement', protect, async (req, res) => {
  try {
    const { company, domain, batch, search, page = 1, limit = 12 } = req.query;
    const query = { isApproved: true };
    if (company) query.company = { $regex: company, $options: 'i' };
    if (domain) query.domain = { $regex: domain, $options: 'i' };
    if (batch) query.year = Number(batch);
    if (search) query.$text = { $search: search };

    const total = await PlacementExp.countDocuments(query);
    const experiences = await PlacementExp.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('author', 'name profilePicture branch graduationYear');

    res.json({ success: true, total, experiences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/experiences/placement
router.post('/placement', protect, async (req, res) => {
  try {
    const exp = await PlacementExp.create({ ...req.body, author: req.user._id });
    await exp.populate('author', 'name profilePicture branch');
    res.status(201).json({ success: true, experience: exp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/experiences/placement/:id
router.get('/placement/:id', protect, async (req, res) => {
  try {
    const exp = await PlacementExp.findById(req.params.id).populate(
      'author',
      'name profilePicture branch graduationYear linkedin github'
    );
    if (!exp) return res.status(404).json({ error: 'Experience not found' });
    res.json({ success: true, experience: exp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/experiences/placement/:id/like
router.put('/placement/:id/like', protect, async (req, res) => {
  try {
    const exp = await PlacementExp.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Not found' });
    const idx = exp.likes.indexOf(req.user._id);
    if (idx === -1) exp.likes.push(req.user._id);
    else exp.likes.splice(idx, 1);
    await exp.save();
    res.json({ success: true, likes: exp.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== INTERNSHIP EXPERIENCES ==========

// @route GET /api/experiences/internship
router.get('/internship', protect, async (req, res) => {
  try {
    const { company, search, page = 1, limit = 12 } = req.query;
    const query = { isApproved: true };
    if (company) query.company = { $regex: company, $options: 'i' };
    if (search) query.$text = { $search: search };

    const total = await InternshipExp.countDocuments(query);
    const experiences = await InternshipExp.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('author', 'name profilePicture branch');

    res.json({ success: true, total, experiences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/experiences/internship
router.post('/internship', protect, async (req, res) => {
  try {
    const exp = await InternshipExp.create({ ...req.body, author: req.user._id });
    await exp.populate('author', 'name profilePicture branch');
    res.status(201).json({ success: true, experience: exp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/experiences/internship/:id
router.get('/internship/:id', protect, async (req, res) => {
  try {
    const exp = await InternshipExp.findById(req.params.id).populate(
      'author',
      'name profilePicture branch graduationYear linkedin github'
    );
    if (!exp) return res.status(404).json({ error: 'Experience not found' });
    res.json({ success: true, experience: exp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/experiences/internship/:id/like
router.put('/internship/:id/like', protect, async (req, res) => {
  try {
    const exp = await InternshipExp.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Not found' });
    const idx = exp.likes.indexOf(req.user._id);
    if (idx === -1) exp.likes.push(req.user._id);
    else exp.likes.splice(idx, 1);
    await exp.save();
    res.json({ success: true, likes: exp.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
