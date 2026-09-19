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

// Stricter rate limit on auth endpoints in production, generous in development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || (process.env.NODE_ENV === 'production' ? 20 : 200),
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
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

// Health & Dynamic Live Server Status
app.get(['/', '/api', '/health'], async (req, res) => {
  try {
    const User = require('./models/User');
    const Medium = require('./models/Medium');
    const GalleryItem = require('./models/GalleryItem');
    const RecordedSession = require('./models/RecordedSession');

    const [totalUsers, totalMediums, totalGallery, totalRecordings, recentUsers] = await Promise.all([
      User.countDocuments(),
      Medium.countDocuments(),
      GalleryItem.countDocuments(),
      RecordedSession.countDocuments(),
      User.find()
        .select('name email role subscriptionTier subscriptionStatus createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      success: true,
      message: '🎨 ArtCrew API is running & connected to MongoDB Atlas',
      version: '1.0.0',
      database: {
        status: 'Connected',
        cluster: 'MongoDB Atlas',
      },
      liveStats: {
        totalRegisteredUsers: totalUsers,
        totalArtMediums: totalMediums,
        totalGalleryArtworks: totalGallery,
        totalMasterclasses: totalRecordings,
      },
      recentRegistrations: recentUsers.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        tier: u.subscriptionTier || 'Free / Basic',
        status: u.subscriptionStatus,
        registeredAt: u.createdAt,
      })),
      endpoints: {
        auth: '/api/auth (POST /signup, POST /login, GET /me)',
        mediums: '/api/mediums',
        gallery: '/api/gallery',
        subscriptions: '/api/subscriptions',
        liveSessions: '/api/live-sessions',
        recordings: '/api/recordings',
        studios: '/api/studios',
        assistant: '/api/assistant',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      success: true,
      message: '🎨 ArtCrew API is running',
      version: '1.0.0',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
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
