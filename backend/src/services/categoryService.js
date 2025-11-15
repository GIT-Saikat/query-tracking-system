const prisma = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const getCategories = async () => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            queries: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { categories };
  } catch (error) {
    logger.error('Error getting categories:', error);
    throw error;
  }
};

const getCategoryById = async (categoryId) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            queries: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    return category;
  } catch (error) {
    logger.error('Error getting category by ID:', error);
    throw error;
  }
};

const createCategory = async (categoryData) => {
  try {
    const category = await prisma.category.create({
      data: categoryData,
    });

    return category;
  } catch (error) {
    logger.error('Error creating category:', error);
    throw error;
  }
};

const updateCategory = async (categoryId, updateData) => {
  try {
    await getCategoryById(categoryId);

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    });

    return updatedCategory;
  } catch (error) {
    logger.error('Error updating category:', error);
    throw error;
  }
};

const deleteCategory = async (categoryId) => {
  try {
    await getCategoryById(categoryId);

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Category deleted successfully' };
  } catch (error) {
    logger.error('Error deleting category:', error);
    throw error;
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

