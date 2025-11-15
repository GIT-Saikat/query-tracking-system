const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Get all responses for a query
 */
const getResponses = async (queryId) => {
  try {
    // Verify query exists
    const query = await prisma.query.findUnique({
      where: { id: queryId },
    });

    if (!query) {
      throw new NotFoundError('Query');
    }

    const responses = await prisma.response.findMany({
      where: { queryId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    return { responses };
  } catch (error) {
    logger.error('Error getting responses:', error);
    throw error;
  }
};

/**
 * Create a new response
 */
const createResponse = async (responseData) => {
  try {
    const { queryId, userId, content, isInternal = false, attachments = [] } = responseData;

    // Verify query exists
    const query = await prisma.query.findUnique({
      where: { id: queryId },
    });

    if (!query) {
      throw new NotFoundError('Query');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Create response
    const response = await prisma.response.create({
      data: {
        queryId,
        userId,
        content,
        isInternal,
        attachments,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        query: {
          select: {
            id: true,
            subject: true,
            status: true,
          },
        },
      },
    });

    // Update query status if it's NEW or ASSIGNED
    if (query.status === 'NEW' || query.status === 'ASSIGNED') {
      await prisma.query.update({
        where: { id: queryId },
        data: {
          status: 'IN_PROGRESS',
        },
      });
    }

    return response;
  } catch (error) {
    logger.error('Error creating response:', error);
    throw error;
  }
};

/**
 * Update response
 */
const updateResponse = async (responseId, updateData) => {
  try {
    const response = await prisma.response.findUnique({
      where: { id: responseId },
    });

    if (!response) {
      throw new NotFoundError('Response');
    }

    const updatedResponse = await prisma.response.update({
      where: { id: responseId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedResponse;
  } catch (error) {
    logger.error('Error updating response:', error);
    throw error;
  }
};

/**
 * Delete response
 */
const deleteResponse = async (responseId) => {
  try {
    const response = await prisma.response.findUnique({
      where: { id: responseId },
    });

    if (!response) {
      throw new NotFoundError('Response');
    }

    await prisma.response.delete({
      where: { id: responseId },
    });

    return { message: 'Response deleted successfully' };
  } catch (error) {
    logger.error('Error deleting response:', error);
    throw error;
  }
};

module.exports = {
  getResponses,
  createResponse,
  updateResponse,
  deleteResponse,
};

