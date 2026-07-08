const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['dsa', 'web-dev', 'ai-ml', 'aptitude', 'resume', 'core-subjects', 'other'],
      required: true,
    },
    subject: { type: String, default: '' }, // for core-subjects category
    type: {
      type: String,
      enum: ['pdf', 'notes', 'drive-link', 'video-link', 'article', 'other'],
      required: true,
    },
    url: { type: String, default: '' }, // external URL or uploaded file path
    filename: { type: String, default: '' }, // original filename if uploaded
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    downloads: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: String }],
    isApproved: { type: Boolean, default: true },
    isReported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
