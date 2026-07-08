require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('./models/Resource');
const User = require('./models/User');

const resourcesToSeed = [
  // Engineering Graphics
  {
    title: 'Engineering Drawing Textbook by N.D. Bhatt',
    description:
      'Standard reference textbook for Engineering Graphics/Drawing. Extremely detailed explanations and step-by-step projection steps.',
    category: 'core-subjects',
    subject: 'Engineering Graphics',
    type: 'drive-link',
    url: 'https://example.com/engineering-drawing-nd-bhatt',
    tags: ['drawing', 'graphics', 'projections', 'btech-1st-year'],
    isApproved: true,
  },
  {
    title: 'Engineering Drawing Video Tutorials - Tikle Academy',
    description:
      'Comprehensive video lectures covering projection of lines, planes, solids, and isometric drawings.',
    category: 'core-subjects',
    subject: 'Engineering Graphics',
    type: 'video-link',
    url: 'https://www.youtube.com/playlist?list=PLDN15yA0JGPQWb_kI2T4Q_yK3w2m7m-lT',
    tags: ['video', 'tutorials', 'drawing', 'graphics'],
    isApproved: true,
  },
  // Chemistry
  {
    title: 'Engineering Chemistry Semester Lecture Notes',
    description:
      'Detailed unit-wise notes covering Water Technology, Corrosion & Control, Phase Rule, Spectroscopy, and Fuels.',
    category: 'core-subjects',
    subject: 'Chemistry',
    type: 'notes',
    url: 'https://example.com/engineering-chemistry-notes',
    tags: ['chemistry', 'notes', 'btech-1st-year', 'exams'],
    isApproved: true,
  },
  {
    title: 'Engineering Chemistry Video Course - Ekeeda',
    description:
      'Semester-specific video explanations for core engineering chemistry concepts and numericals.',
    category: 'core-subjects',
    subject: 'Chemistry',
    type: 'video-link',
    url: 'https://www.youtube.com/playlist?list=PL3REs3PyoB7p37X2k14oEqB1F4rL97gJ2',
    tags: ['chemistry', 'video', 'ekeeda', 'btech'],
    isApproved: true,
  },
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
  // Python Programming
  {
    title: 'Python for Beginners 6-Hour Course - Programming with Mosh',
    description:
      'An excellent full-length video course teaching Python syntax, collections, exception handling, and object-oriented programming.',
    category: 'core-subjects',
    subject: 'Python Programming',
    type: 'video-link',
    url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
    tags: ['python', 'basics', 'programming', 'mosh', 'oop'],
    isApproved: true,
  },
  {
    title: 'Automate the Boring Stuff with Python - Online Guide',
    description:
      'Practical programming course for total beginners. Highly hands-on projects showing script writing, web scraping, and automation.',
    category: 'core-subjects',
    subject: 'Python Programming',
    type: 'drive-link',
    url: 'https://automatetheboringstuff.com/',
    tags: ['python', 'guide', 'automation', 'hands-on', 'projects'],
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

    for (const resData of resourcesToSeed) {
      const existing = await Resource.findOne({ title: resData.title });
      if (existing) {
        console.log(`Resource already exists: "${resData.title}"`);
      } else {
        await Resource.create({
          ...resData,
          uploadedBy: senior._id,
        });
        console.log(`✅ Created resource: "${resData.title}"`);
      }
    }

    console.log('Seeding completed successfully!');
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

seed();
