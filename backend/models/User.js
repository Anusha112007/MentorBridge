const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['junior', 'senior', 'admin'], default: 'junior' },

    // Common fields
    branch: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    profilePicture: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    skills: [{ type: String }],

    // Senior-specific
    graduationYear: { type: Number },
    areasOfExpertise: [{ type: String }],
    internshipExperiences: [{ type: String }],
    placementCompany: { type: String, default: '' },
    currentDesignation: { type: String, default: '' },
    availabilityStatus: { type: Boolean, default: true },
    leetcode: { type: String, default: '' },
    rating: { type: Number, default: 5.0 },
    menteeCount: { type: Number, default: 0 },
    areasOfMentorship: [{ type: String }],
    projects: [
      {
        title: { type: String },
        description: { type: String },
        link: { type: String },
      },
    ],
    certifications: [
      {
        name: { type: String },
        issuer: { type: String },
        date: { type: Date },
      },
    ],
    reviews: [
      {
        reviewerName: { type: String },
        comment: { type: String },
        rating: { type: Number },
        date: { type: Date, default: Date.now },
      },
    ],

    // Junior-specific
    currentYear: { type: Number },
    interests: [{ type: String }],
    careerGoals: { type: String, maxlength: 300 },

    // Admin / verification
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
