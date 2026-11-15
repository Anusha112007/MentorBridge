require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB, getDbStatus } = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'https://mentorbridge-frontend.onrender.com',
  'https://mentorbridge-backend-a3ru.onrender.com',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for educational platform while supporting credentials
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint (always accessible regardless of DB state)
app.get('/api/health', (req, res) => {
  const db = getDbStatus();
  const isHealthy = db.readyState === 1;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    time: new Date().toISOString(),
    database: db,
    tip: isHealthy
      ? 'Database connected and operational'
      : 'Database unavailable. If using MongoDB Atlas (M0 free cluster), check if paused in Atlas dashboard or verify MONGO_URI in Render dashboard.',
  });
});

// Database readiness check middleware for all other /api routes
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const db = getDbStatus();
    return res.status(503).json({
      error:
        'Database connection unavailable. MongoDB is reconnecting or unavailable in cloud environment.',
      code: 'DB_UNAVAILABLE',
      database: {
        readyState: db.readyStateString,
        uriConfigured: db.uriConfigured,
        uriType: db.uriType,
        maskedUri: db.maskedUri,
        lastError: db.error,
      },
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/experiences', require('./routes/experiences'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/admin', require('./routes/admin'));

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => res.status(404).json({ error: 'API route not found' }));

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MentorBridge Server running on http://localhost:${PORT}`));
