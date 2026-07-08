const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ['placement', 'internship', 'subject', 'project', 'career', 'general'],
      default: 'general',
    },
    tags: [{ type: String }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', default: null },
    isReported: { type: Boolean, default: false },
    isClosed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionSchema.index({ title: 'text', body: 'text', tags: 'text' });

module.exports = mongoose.model('Question', questionSchema);
