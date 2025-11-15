const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin, Manager)
 */
router.get('/', authorize('ADMIN', 'MANAGER'), userController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID'), validate],
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin, Manager, or self)
 */
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

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID'), validate],
  authorize('ADMIN'),
  userController.deleteUser
);

module.exports = router;

