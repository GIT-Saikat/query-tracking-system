const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

const getUsers = async (filters = {}) => {
  try {
    const {
      role,
      department,
      isActive,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (role) where.role = role;
    if (department) where.department = department;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        isActive: true,
        skills: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedQueries: true,
            createdResponses: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.user.count({ where });

    return {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Error getting users:', error);
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        isActive: true,
        skills: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedQueries: true,
            createdResponses: true,
            escalations: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    throw error;
  }
};

const updateUser = async (userId, updateData) => {
  try {
    await getUserById(userId);

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        isActive: true,
        skills: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
};

const deleteUser = async (userId) => {
  try {
    await getUserById(userId);

    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};

