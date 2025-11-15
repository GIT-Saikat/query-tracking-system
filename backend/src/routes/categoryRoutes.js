const express = require('express');
const { body, param } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', categoryController.getCategories);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid category ID'), validate],
  categoryController.getCategoryById
);

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

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid category ID'), validate],
  authorize('ADMIN', 'MANAGER'),
  categoryController.deleteCategory
);

module.exports = router;

