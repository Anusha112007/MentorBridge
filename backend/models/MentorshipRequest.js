const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema(
  {
    junior: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senior: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, maxlength: 500, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    goals: { type: String, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate requests
mentorshipRequestSchema.index({ junior: 1, senior: 1 }, { unique: true });

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
