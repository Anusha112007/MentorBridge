require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedUsers = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://anusha:saibabuanu@cluster0.58wk908.mongodb.net/mentorbridge?retryWrites=true&w=majority&appName=Cluster0';
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB for seeding');

    // 1. Seed medisettianusha9@gmail.com (Junior Anu)
    let anu = await User.findOne({ email: 'medisettianusha9@gmail.com' });
    if (!anu) {
      anu = new User({
        name: 'Anu Medisetti',
        email: 'medisettianusha9@gmail.com',
        password: 'password123',
        role: 'junior',
        branch: 'Computer Science & Engineering',
        currentYear: 2,
        interests: ['Web Development', 'DSA', 'Machine Learning'],
        careerGoals: 'Seeking guidance on full-stack projects and placement prep.',
        isVerified: true,
        isActive: true,
      });
      await anu.save();
      console.log('✅ Seeded Junior: medisettianusha9@gmail.com / password123');
    } else {
      anu.password = 'password123';
      anu.isVerified = true;
      anu.isActive = true;
      await anu.save();
      console.log('ℹ️ Updated Junior: medisettianusha9@gmail.com / password123');
    }

    // 2. Seed anushamedisetti62@gmail.com (Senior Rahul)
    let rahul = await User.findOne({ email: 'anushamedisetti62@gmail.com' });
    if (!rahul) {
      rahul = new User({
        name: 'Rahul Sharma',
        email: 'anushamedisetti62@gmail.com',
        password: 'password123',
        role: 'senior',
        branch: 'Computer Science & Engineering',
        graduationYear: 2025,
        placementCompany: 'Microsoft',
        currentDesignation: 'Software Development Engineer',
        areasOfExpertise: ['Full Stack Development', 'DSA & LeetCode', 'System Design'],
        areasOfMentorship: ['Resume Review', 'Mock Interviews', 'DSA Guidance'],
        rating: 4.9,
        menteeCount: 18,
        isVerified: true,
        isActive: true,
      });
      await rahul.save();
      console.log('✅ Seeded Senior: anushamedisetti62@gmail.com / password123');
    } else {
      rahul.password = 'password123';
      rahul.isVerified = true;
      rahul.isActive = true;
      await rahul.save();
      console.log('ℹ️ Updated Senior: anushamedisetti62@gmail.com / password123');
    }

    // 3. Seed admin@college.edu (Admin)
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
      admin.password = 'adminpassword123';
      admin.isVerified = true;
      admin.isActive = true;
      await admin.save();
      console.log('ℹ️ Updated Admin: admin@college.edu / adminpassword123');
    }

    // 4. Also seed fallback junior@college.edu and senior@college.edu
    let junior2 = await User.findOne({ email: 'junior@college.edu' });
    if (!junior2) {
      junior2 = new User({
        name: 'Aarav Sharma',
        email: 'junior@college.edu',
        password: 'password123',
        role: 'junior',
        branch: 'Computer Science & Engineering',
        currentYear: 2,
        interests: ['Web Development', 'DSA'],
        careerGoals: 'Internship preparation',
        isVerified: true,
        isActive: true,
      });
      await junior2.save();
      console.log('✅ Seeded Junior: junior@college.edu / password123');
    }

    let senior2 = await User.findOne({ email: 'senior@college.edu' });
    if (!senior2) {
      senior2 = new User({
        name: 'Priya Patel',
        email: 'senior@college.edu',
        password: 'password123',
        role: 'senior',
        branch: 'Computer Science & Engineering',
        graduationYear: 2025,
        placementCompany: 'Google',
        currentDesignation: 'Associate Software Engineer',
        areasOfExpertise: ['Full Stack', 'DSA'],
        areasOfMentorship: ['Resume Review', 'Mock Interviews'],
        rating: 4.9,
        menteeCount: 14,
        isVerified: true,
        isActive: true,
      });
      await senior2.save();
      console.log('✅ Seeded Senior: senior@college.edu / password123');
    }

    console.log('🎉 All users successfully seeded into MongoDB Atlas!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedUsers();
