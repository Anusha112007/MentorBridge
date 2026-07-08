const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route GET /api/messages/conversations — List unique conversations
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const msgs = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$sender', '$receiver'] },
              { a: '$sender', b: '$receiver' },
              { a: '$receiver', b: '$sender' },
            ],
          },
          lastMessage: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$lastMessage' } },
      { $sort: { createdAt: -1 } },
    ]);

    const populated = await Message.populate(msgs, [
      { path: 'sender', select: 'name profilePicture role' },
      { path: 'receiver', select: 'name profilePicture role' },
    ]);
    res.json({ success: true, conversations: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/messages/:userId — Get chat history
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');

    // Mark as read
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/messages/:userId — Send a message
router.post('/:userId', protect, upload.single('attachment'), async (req, res) => {
  try {
    const { content } = req.body;
    const attachment = req.file ? `/uploads/${req.file.filename}` : '';
    if (!content && !attachment) return res.status(400).json({ error: 'Message content required' });

    const msg = await Message.create({
      sender: req.user._id,
      receiver: req.params.userId,
      content: content || '',
      attachment,
    });
    await msg.populate([
      { path: 'sender', select: 'name profilePicture' },
      { path: 'receiver', select: 'name profilePicture' },
    ]);
    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
