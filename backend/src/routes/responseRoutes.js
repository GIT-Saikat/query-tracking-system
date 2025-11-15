const express = require('express');
const { body, param } = require('express-validator');
const responseController = require('../controllers/responseController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/responses/query/:queryId
 * @desc    Get all responses for a query
 * @access  Private
 */
router.get(
  '/query/:queryId',
  [param('queryId').isUUID().withMessage('Invalid query ID'), validate],
  responseController.getResponses
);

/**
 * @route   POST /api/responses
 * @desc    Create a new response
 * @access  Private
 */
router.post(
  '/',
  [
    body('queryId').isUUID().withMessage('Valid query ID is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('isInternal').optional().isBoolean(),
    body('attachments').optional().isArray(),
    validate,
  ],
  responseController.createResponse
);

/**
 * @route   PUT /api/responses/:id
 * @desc    Update response
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid response ID'),
    body('content').optional().trim(),
    body('attachments').optional().isArray(),
    validate,
  ],
  responseController.updateResponse
);

/**
 * @route   DELETE /api/responses/:id
 * @desc    Delete response
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid response ID'), validate],
  responseController.deleteResponse
);

module.exports = router;

