const express = require('express');
const router = express.Router();
const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route POST /api/mentorship/request — Junior sends request to senior
router.post('/request', protect, authorize('junior'), async (req, res) => {
  try {
    const { seniorId, message, goals } = req.body;
    const senior = await User.findById(seniorId);
    if (!senior || senior.role !== 'senior')
      return res.status(404).json({ error: 'Senior not found' });

    const existing = await MentorshipRequest.findOne({ junior: req.user._id, senior: seniorId });
    if (existing) return res.status(409).json({ error: 'Request already sent to this senior' });

    const request = await MentorshipRequest.create({
      junior: req.user._id,
      senior: seniorId,
      message,
      goals,
    });
    await request.populate(['junior', 'senior']);
    res.status(201).json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/mentorship/my-requests — Get all requests for logged-in user
router.get('/my-requests', protect, async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'junior') {
      requests = await MentorshipRequest.find({ junior: req.user._id }).populate(
        'senior',
        'name branch skills placementCompany profilePicture availabilityStatus'
      );
    } else if (req.user.role === 'senior') {
      requests = await MentorshipRequest.find({ senior: req.user._id }).populate(
        'junior',
        'name branch currentYear skills interests profilePicture'
      );
    } else {
      requests = await MentorshipRequest.find().populate(['junior', 'senior']);
    }
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/mentorship/:id/accept — Senior accepts
router.put('/:id/accept', protect, authorize('senior', 'admin'), async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.senior.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    request.status = 'accepted';
    await request.save();
    await request.populate(['junior', 'senior']);
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/mentorship/:id/reject — Senior rejects
router.put('/:id/reject', protect, authorize('senior', 'admin'), async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.senior.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    request.status = 'rejected';
    await request.save();
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route DELETE /api/mentorship/:id — Junior withdraws request
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.junior.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    await request.deleteOne();
    res.json({ success: true, message: 'Request withdrawn' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
