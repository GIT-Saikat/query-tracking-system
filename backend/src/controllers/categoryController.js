const categoryService = require('../services/categoryService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategories();

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Get category by ID
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.getCategoryById(id);

  res.status(200).json({
    status: 'success',
    data: { category },
  });
});

/**
 * Create category
 */
const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Category created successfully',
    data: { category },
  });
});

/**
 * Update category
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.updateCategory(id, req.body);

  res.status(200).json({
    status: 'success',
    message: 'Category updated successfully',
    data: { category },
  });
});

/**
 * Delete category
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await categoryService.deleteCategory(id);

  res.status(200).json({
    status: 'success',
    message: 'Category deleted successfully',
  });
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

