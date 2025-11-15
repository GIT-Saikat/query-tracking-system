const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const queryRoutes = require('./queryRoutes');
const channelRoutes = require('./channelRoutes');
const categoryRoutes = require('./categoryRoutes');
const responseRoutes = require('./responseRoutes');
const integrationRoutes = require('./integrationRoutes');
const webhookRoutes = require('./webhookRoutes');

const router = express.Router();

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
      integrations: '/api/integrations',
      webhooks: '/api/webhooks',
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/queries', queryRoutes);
router.use('/channels', channelRoutes);
router.use('/categories', categoryRoutes);
router.use('/responses', responseRoutes);
router.use('/integrations', integrationRoutes);
router.use('/webhooks', webhookRoutes);

module.exports = router;

