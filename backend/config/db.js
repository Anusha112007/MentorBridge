const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    console.error(
      '⚠️  Server running without database. Start MongoDB locally or update MONGO_URI in .env'
    );
    // Don't exit — allow server to run (API calls will fail gracefully)
  }
};

module.exports = connectDB;
