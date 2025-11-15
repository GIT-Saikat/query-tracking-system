const express = require('express');
const { body, param } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Private
 */
router.get('/', categoryController.getCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid category ID'), validate],
  categoryController.getCategoryById
);

/**
 * @route   POST /api/categories
 * @desc    Create category
 * @access  Private (Admin, Manager)
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('description').optional().trim(),
    body('color').optional().trim(),
    validate,
  ],
  authorize('ADMIN', 'MANAGER'),
  categoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin, Manager)
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid category ID'),
    body('name').optional().trim(),
    body('description').optional().trim(),
    body('color').optional().trim(),
    validate,
  ],
  authorize('ADMIN', 'MANAGER'),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (Admin, Manager)
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid category ID'), validate],
  authorize('ADMIN', 'MANAGER'),
  categoryController.deleteCategory
);

module.exports = router;

