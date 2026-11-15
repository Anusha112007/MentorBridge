require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedUsers = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mentorbridge';
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB for seeding');

    // Create or update demo junior
    let junior = await User.findOne({ email: 'junior@college.edu' });
    if (!junior) {
      junior = new User({
        name: 'Aarav Sharma',
        email: 'junior@college.edu',
        password: 'password123',
        role: 'junior',
        branch: 'Computer Science & Engineering',
        currentYear: 2,
        interests: ['Web Development', 'DSA', 'Machine Learning'],
        careerGoals: 'Looking for guidance on full-stack development and internships.',
        isVerified: true,
        isActive: true,
      });
      await junior.save();
      console.log('✅ Seeded Junior: junior@college.edu / password123');
    } else {
      console.log('ℹ️ Junior account already exists');
    }

    // Create or update demo senior
    let senior = await User.findOne({ email: 'senior@college.edu' });
    if (!senior) {
      senior = new User({
        name: 'Priya Patel',
        email: 'senior@college.edu',
        password: 'password123',
        role: 'senior',
        branch: 'Computer Science & Engineering',
        graduationYear: 2025,
        placementCompany: 'Google',
        currentDesignation: 'Associate Software Engineer',
        areasOfExpertise: ['Full Stack Development', 'DSA & LeetCode', 'System Design'],
        areasOfMentorship: ['Resume Review', 'Mock Interviews', 'DSA Guidance'],
        rating: 4.9,
        menteeCount: 14,
        isVerified: true,
        isActive: true,
      });
      await senior.save();
      console.log('✅ Seeded Senior: senior@college.edu / password123');
    } else {
      console.log('ℹ️ Senior account already exists');
    }

    // Create or update demo admin
    let admin = await User.findOne({ email: 'admin@college.edu' });
    if (!admin) {
      admin = new User({
        name: 'Platform Administrator',
        email: 'admin@college.edu',
        password: 'adminpassword123',
        role: 'admin',
        branch: 'Administration',
        isVerified: true,
        isActive: true,
      });
      await admin.save();
      console.log('✅ Seeded Admin: admin@college.edu / adminpassword123');
    } else {
      console.log('ℹ️ Admin account already exists');
    }

    console.log('🎉 Seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedUsers();
