const express = require('express');
const { body, param } = require('express-validator');
const responseController = require('../controllers/responseController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.get(
  '/query/:queryId',
  [param('queryId').isUUID().withMessage('Invalid query ID'), validate],
  responseController.getResponses
);

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

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid response ID'), validate],
  responseController.deleteResponse
);

module.exports = router;

