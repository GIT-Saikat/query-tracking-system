const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), userController.getUsers);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID'), validate],
  userController.getUserById
);

router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'AGENT']),
    body('department').optional().trim(),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  userController.updateUser
);

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID'), validate],
  authorize('ADMIN'),
  userController.deleteUser
);

module.exports = router;

