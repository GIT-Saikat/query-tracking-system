const express = require('express');
const { param } = require('express-validator');
const webhookController = require('../controllers/webhookController');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.all(
  '/facebook/:channelId',
  [
    param('channelId').isUUID().withMessage('Invalid channel ID'),
    validate,
  ],
  webhookController.handleFacebookWebhook
);

router.all(
  '/instagram/:channelId',
  [
    param('channelId').isUUID().withMessage('Invalid channel ID'),
    validate,
  ],
  webhookController.handleInstagramWebhook
);

router.post(
  '/slack/:channelId',
  [
    param('channelId').isUUID().withMessage('Invalid channel ID'),
    validate,
  ],
  webhookController.handleSlackWebhook
);

router.post(
  '/:channelId',
  [
    param('channelId').isUUID().withMessage('Invalid channel ID'),
    validate,
  ],
  webhookController.handleGenericWebhook
);

module.exports = router;

