const express = require('express');
const { param } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.post(
  '/:channelId/start',
  [
    param('channelId').isUUID().withMessage('Invalid channel ID'),
    validate,
  ],
  authorize('ADMIN', 'MANAGER'),
  integrationController.startIntegration
);

router.post(
  '/:channelId/stop',
  [
    param('channelId').isUUID().withMessage('Invalid channel ID'),
    validate,
  ],
  authorize('ADMIN', 'MANAGER'),
  integrationController.stopIntegration
);

router.post(
  '/:channelId/test',
  [
    param('channelId').isUUID().withMessage('Invalid channel ID'),
    validate,
  ],
  authorize('ADMIN', 'MANAGER'),
  integrationController.testConnection
);

router.get(
  '/:channelId/status',
  [
    param('channelId').isUUID().withMessage('Invalid channel ID'),
    validate,
  ],
  integrationController.getIntegrationStatus
);

router.get('/status', integrationController.getAllIntegrationStatuses);

router.post(
  '/:channelId/reload',
  [
    param('channelId').isUUID().withMessage('Invalid channel ID'),
    validate,
  ],
  authorize('ADMIN', 'MANAGER'),
  integrationController.reloadIntegration
);

module.exports = router;

