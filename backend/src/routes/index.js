const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const queryRoutes = require('./queryRoutes');
const channelRoutes = require('./channelRoutes');
const categoryRoutes = require('./categoryRoutes');
const responseRoutes = require('./responseRoutes');

const router = express.Router();

// Root API route
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Query Tracking API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      queries: '/api/queries',
      channels: '/api/channels',
      categories: '/api/categories',
      responses: '/api/responses',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/queries', queryRoutes);
router.use('/channels', channelRoutes);
router.use('/categories', categoryRoutes);
router.use('/responses', responseRoutes);

module.exports = router;

