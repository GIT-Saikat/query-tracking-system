const express = require('express');
const { body, param } = require('express-validator');
const channelController = require('../controllers/channelController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/channels
 * @desc    Get all channels
 * @access  Private
 */
router.get('/', channelController.getChannels);

/**
 * @route   GET /api/channels/:id
 * @desc    Get channel by ID
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid channel ID'), validate],
  channelController.getChannelById
);

/**
 * @route   POST /api/channels
 * @desc    Create channel
 * @access  Private (Admin, Manager)
 */
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

/**
 * @route   PUT /api/channels/:id
 * @desc    Update channel
 * @access  Private (Admin, Manager)
 */
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

/**
 * @route   DELETE /api/channels/:id
 * @desc    Delete channel
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid channel ID'), validate],
  authorize('ADMIN'),
  channelController.deleteChannel
);

module.exports = router;

