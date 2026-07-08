const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { protect } = require('../middleware/auth');

// @route GET /api/questions — Get all questions with filters
router.get('/', protect, async (req, res) => {
  try {
    const { category, tags, search, page = 1, limit = 15, sort = 'newest' } = req.query;
    const query = { isClosed: false };
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(',').map((t) => t.trim()) };
    if (search) query.$text = { $search: search };

    const sortOption =
      sort === 'popular'
        ? { upvotes: -1 }
        : sort === 'unanswered'
          ? { answers: 1 }
          : { createdAt: -1 };

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('author', 'name profilePicture role branch')
      .populate({ path: 'answers', select: '_id' });

    res.json({ success: true, total, page: Number(page), questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/questions — Ask a question
router.post('/', protect, async (req, res) => {
  try {
    const { title, body, category, tags, isAnonymous } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

    const question = await Question.create({
      author: req.user._id,
      title,
      body,
      category,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
    });
    await question.populate('author', 'name profilePicture role');
    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/questions/:id — Get single question with answers
router.get('/:id', protect, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name profilePicture role branch')
      .populate({
        path: 'answers',
        populate: { path: 'author', select: 'name profilePicture role' },
      });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/questions/:id/answers — Post an answer
router.post('/:id/answers', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const answer = await Answer.create({
      question: question._id,
      author: req.user._id,
      body: req.body.body,
    });
    question.answers.push(answer._id);
    await question.save();
    await answer.populate('author', 'name profilePicture role');
    res.status(201).json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/questions/:id/upvote — Toggle upvote on question
router.put('/:id/upvote', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    const idx = question.upvotes.indexOf(req.user._id);
    if (idx === -1) question.upvotes.push(req.user._id);
    else question.upvotes.splice(idx, 1);
    await question.save();
    res.json({ success: true, upvotes: question.upvotes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/answers/:id/upvote — Toggle upvote on answer
router.put('/answers/:id/upvote', protect, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    const idx = answer.upvotes.indexOf(req.user._id);
    if (idx === -1) answer.upvotes.push(req.user._id);
    else answer.upvotes.splice(idx, 1);
    await answer.save();
    res.json({ success: true, upvotes: answer.upvotes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/answers/:id/accept — Accept an answer
router.put('/answers/:id/accept', protect, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate('question');
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    if (answer.question.author.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Only the question author can accept answers' });

    await Answer.updateMany({ question: answer.question._id }, { isAccepted: false });
    answer.isAccepted = true;
    await answer.save();
    answer.question.acceptedAnswer = answer._id;
    await answer.question.save();
    res.json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
