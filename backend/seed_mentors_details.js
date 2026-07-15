require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedDetails = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const seniors = await User.find({ role: 'senior' });
    if (seniors.length === 0) {
      console.log('⚠️ No seniors found to seed.');
      process.exit(0);
    }

    const expertisePool = [
      'Web Development',
      'DSA',
      'AI/ML',
      'Data Science',
      'Cybersecurity',
      'Cloud Computing',
      'Competitive Programming',
      'Python',
      'Java',
      'Resume Review',
      'Interview Preparation',
      'Aptitude',
    ];

    const projectPool = [
      {
        title: 'Portfolio Website',
        description: 'A sleek personal portfolio built with HTML, CSS, and JS.',
        link: 'https://github.com/mentor/portfolio',
      },
      {
        title: 'Task Manager API',
        description: 'RESTful API built using Node.js, Express, and MongoDB with JWT auth.',
        link: 'https://github.com/mentor/task-manager',
      },
      {
        title: 'E-commerce Platform',
        description: 'A full-stack e-commerce store with search and stripe payment integration.',
        link: 'https://github.com/mentor/ecommerce',
      },
      {
        title: 'AI Chatbot',
        description: 'OpenAI-powered chatbot integrated with a React frontend.',
        link: 'https://github.com/mentor/chatbot',
      },
      {
        title: 'Sorting Visualizer',
        description:
          'Visualizer tool for major sorting algorithms like QuickSort, MergeSort, and BubbleSort.',
        link: 'https://github.com/mentor/sorting',
      },
    ];

    const certPool = [
      { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' },
      { name: 'Google Cloud Associate Cloud Engineer', issuer: 'Google Cloud' },
      { name: 'Meta Front-End Developer Professional Certificate', issuer: 'Meta' },
      { name: 'Oracle Certified Associate Java Programmer', issuer: 'Oracle' },
      { name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI' },
    ];

    const reviewPool = [
      {
        reviewerName: 'Rohit Sharma',
        comment:
          'Extremely helpful mentor! Guided me through my React project and setup my GitHub profile.',
        rating: 5,
      },
      {
        reviewerName: 'Neha Patil',
        comment: 'Excellent explanations of complex DSA topics like DP and Graph algorithms.',
        rating: 5,
      },
      {
        reviewerName: 'Amit Verma',
        comment:
          'Gave great feedback on my resume and mock interview preparation. Highly recommended!',
        rating: 4,
      },
      {
        reviewerName: 'Sneha Rao',
        comment: 'Patient, highly knowledgeable, and always available to answer doubts.',
        rating: 5,
      },
    ];

    for (const senior of seniors) {
      const rating = parseFloat((4.0 + Math.random()).toFixed(1));
      const menteeCount = Math.floor(Math.random() * 15) + 3;
      const leetcode = `https://leetcode.com/u/${senior.name.toLowerCase().replace(/\s/g, '_')}/`;

      const numSkills = Math.min(senior.skills?.length || 0, 3);
      const areasOfMentorship = (senior.skills || [])
        .slice(0, numSkills)
        .concat((senior.areasOfExpertise || []).slice(0, 1));

      const projects = [
        projectPool[Math.floor(Math.random() * projectPool.length)],
        projectPool[Math.floor(Math.random() * projectPool.length)],
      ].filter((p, i, self) => self.indexOf(p) === i);

      const certifications = [
        certPool[Math.floor(Math.random() * certPool.length)],
        certPool[Math.floor(Math.random() * certPool.length)],
      ].filter((c, i, self) => self.indexOf(c) === i);

      const reviews = [
        reviewPool[Math.floor(Math.random() * reviewPool.length)],
        reviewPool[Math.floor(Math.random() * reviewPool.length)],
      ].filter((r, i, self) => self.indexOf(r) === i);

      let areasOfExpertise = senior.areasOfExpertise || [];
      if (areasOfExpertise.length === 0) {
        areasOfExpertise = [
          expertisePool[Math.floor(Math.random() * 3)],
          expertisePool[Math.floor(Math.random() * 3) + 9],
        ];
      }

      await User.findByIdAndUpdate(senior._id, {
        rating,
        menteeCount,
        leetcode,
        areasOfMentorship,
        projects,
        certifications,
        reviews,
        areasOfExpertise,
      });

      console.log(`Updated senior: ${senior.name}`);
    }

    console.log('✅ Successfully seeded rich senior details.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding:', err);
    process.exit(1);
  }
};

seedDetails();
