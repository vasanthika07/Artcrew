require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const mediumRoutes = require('./routes/mediums');
const galleryRoutes = require('./routes/gallery');
const liveSessionRoutes = require('./routes/liveSessions');
const recordingRoutes = require('./routes/recordings');
const subscriptionRoutes = require('./routes/subscriptions');
const studioRoutes = require('./routes/studios');
const assistantRoutes = require('./routes/assistant');
const adminRoutes = require('./routes/admin');

const app = express();

// Connect to MongoDB
connectDB();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing — raw body saved for webhook signature verification
app.use((req, res, next) => {
  if (req.path === '/api/subscriptions/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Art Studio & Medium Finder API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mediums', mediumRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/admin', adminRoutes);

// 404 & error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎨 Art Studio API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
