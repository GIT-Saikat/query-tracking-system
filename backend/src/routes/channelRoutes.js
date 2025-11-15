const express = require('express');
const { body, param } = require('express-validator');
const channelController = require('../controllers/channelController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', channelController.getChannels);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid channel ID'), validate],
  channelController.getChannelById
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Channel name is required'),
    body('type').isIn(['EMAIL', 'TWITTER', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'DISCORD', 'SLACK', 'TEAMS', 'WHATSAPP', 'WEBSITE_CHAT']).withMessage('Valid channel type is required'),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  authorize('ADMIN', 'MANAGER'),
  channelController.createChannel
);

router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid channel ID'),
    body('name').optional().trim(),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  authorize('ADMIN', 'MANAGER'),
  channelController.updateChannel
);

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid channel ID'), validate],
  authorize('ADMIN'),
  channelController.deleteChannel
);

module.exports = router;

