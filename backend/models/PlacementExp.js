const mongoose = require('mongoose');

const placementExpSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    package: { type: String, default: '' },
    year: { type: Number, required: true },
    batch: { type: String, default: '' },
    domain: { type: String, default: '' },
    process: { type: String, required: true }, // interview process description
    prepStrategy: { type: String, default: '' },
    questionsAsked: { type: String, default: '' },
    tips: { type: String, default: '' },
    mistakes: { type: String, default: '' },
    tags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isReported: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

placementExpSchema.index({ company: 'text', role: 'text', tags: 'text' });

module.exports = mongoose.model('PlacementExp', placementExpSchema);
