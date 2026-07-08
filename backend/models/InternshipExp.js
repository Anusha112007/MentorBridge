const mongoose = require('mongoose');

const internshipExpSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    duration: { type: String, default: '' },
    stipend: { type: String, default: '' },
    year: { type: Number, required: true },
    howFound: { type: String, default: '' }, // how they got the internship
    resumeTips: { type: String, default: '' },
    interviewRounds: { type: String, default: '' },
    learnings: { type: String, default: '' },
    resources: { type: String, default: '' }, // links/resources they used
    tags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isReported: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

internshipExpSchema.index({ company: 'text', role: 'text', tags: 'text' });

module.exports = mongoose.model('InternshipExp', internshipExpSchema);
