const express = require('express');
const { body, param } = require('express-validator');
const queryController = require('../controllers/queryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', queryController.getQueries);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid query ID'), validate],
  queryController.getQueryById
);

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

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid query ID'), validate],
  authorize('ADMIN', 'MANAGER'),
  queryController.deleteQuery
);

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

