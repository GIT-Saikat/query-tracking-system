const express = require('express');
const { body, param } = require('express-validator');
const queryController = require('../controllers/queryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/queries
 * @desc    Get all queries with filters
 * @access  Private
 */
router.get('/', queryController.getQueries);

/**
 * @route   GET /api/queries/:id
 * @desc    Get query by ID
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid query ID'), validate],
  queryController.getQueryById
);

/**
 * @route   POST /api/queries
 * @desc    Create a new query
 * @access  Private (Admin, Manager, or System)
 */
router.post(
  '/',
  [
    body('channelId').isUUID().withMessage('Valid channel ID is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('subject').optional().trim(),
    body('senderName').optional().trim(),
    body('senderEmail').optional().isEmail().normalizeEmail(),
    validate,
  ],
  queryController.createQuery
);

/**
 * @route   PUT /api/queries/:id
 * @desc    Update query
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid query ID'),
    body('status').optional().isIn(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    body('priority').optional().isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    body('categoryId').optional().isUUID(),
    validate,
  ],
  queryController.updateQuery
);

/**
 * @route   DELETE /api/queries/:id
 * @desc    Delete query
 * @access  Private (Admin, Manager)
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid query ID'), validate],
  authorize('ADMIN', 'MANAGER'),
  queryController.deleteQuery
);

/**
 * @route   POST /api/queries/:id/assign
 * @desc    Assign query to user
 * @access  Private (Admin, Manager)
 */
router.post(
  '/:id/assign',
  [
    param('id').isUUID().withMessage('Invalid query ID'),
    body('userId').isUUID().withMessage('Valid user ID is required'),
    body('notes').optional().trim(),
    validate,
  ],
  authorize('ADMIN', 'MANAGER'),
  queryController.assignQuery
);

module.exports = router;

