require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('./models/Resource');
const User = require('./models/User');

const resourcesToSeed = [
  // C Programming
  {
    title: 'C Programming for Beginners Playlist - Neso Academy',
    description:
      'Highly acclaimed tutorial series covering basic syntax, variables, conditionals, loops, functions, and advanced pointers.',
    category: 'core-subjects',
    subject: 'C Programming',
    type: 'video-link',
    url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRggZZgYpPMUxdY1CYkZtXYZ',
    tags: ['c', 'programming', 'neso-academy', 'pointers', 'basics'],
    isApproved: true,
  },
  {
    title: 'The C Programming Language (2nd Edition) - K&R',
    description:
      'Classic reference guide by Dennis Ritchie. A must-have for mastering pointer arithmetic and low-level memory operations.',
    category: 'core-subjects',
    subject: 'C Programming',
    type: 'drive-link',
    url: 'https://example.com/kr-c-programming-pdf',
    tags: ['c', 'book', 'ritchie', 'pdf', 'advanced'],
    isApproved: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find senior to assign resources to
    const senior = await User.findOne({ role: 'senior' });
    if (!senior) {
      console.error('❌ Error: No senior user found to assign resources to!');
      process.exit(1);
    }
    console.log(`Using senior user: ${senior.name} (${senior._id})`);

    // Clean up existing resources to keep database demo-only
    await Resource.deleteMany({});
    console.log('🧹 Cleaned up existing resources');

    for (const resData of resourcesToSeed) {
      await Resource.create({
        ...resData,
        uploadedBy: senior._id,
      });
      console.log(`✅ Created resource: "${resData.title}"`);
    }

    console.log('Seeding completed successfully!');
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

seed();
