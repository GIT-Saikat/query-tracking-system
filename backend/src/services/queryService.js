const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const config = require('../config/config');
const MLService = require('./mlService');

const calculateSlaDueAt = (priority) => {
  const hours = config.slaTimes[priority] || config.slaTimes.MEDIUM;
  const dueDate = new Date();
  dueDate.setHours(dueDate.getHours() + hours);
  return dueDate;
};

const detectPriority = (content, isVip = false, sentiment = 'NEUTRAL') => {

  if (isVip) {
    return 'HIGH';
  }

  if (sentiment === 'NEGATIVE') {
    return 'HIGH';
  }

  const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'broken', 'down'];
  const contentLower = content.toLowerCase();

  if (urgentKeywords.some(keyword => contentLower.includes(keyword))) {
    return 'HIGH';
  }

  return 'MEDIUM';
};

const getQueries = async (filters = {}) => {
  try {
    const {
      status,
      priority,
      channelId,
      categoryId,
      userId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'receivedAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (channelId) where.channelId = channelId;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
        { senderEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    let assignmentFilter = {};
    if (userId) {
      assignmentFilter = {
        assignments: {
          some: {
            userId,
          },
        },
      };
    }

    const queries = await prisma.query.findMany({
      where: {
        ...where,
        ...assignmentFilter,
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        assignments: {
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
        },
        _count: {
          select: {
            responses: true,
            escalations: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.query.count({
      where: {
        ...where,
        ...assignmentFilter,
      },
    });

    return {
      queries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Error getting queries:', error);
    throw error;
  }
};

const getQueryById = async (queryId) => {
  try {
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      include: {
        channel: true,
        category: true,
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                department: true,
              },
            },
          },
        },
        responses: {
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
          orderBy: {
            sentAt: 'asc',
          },
        },
        escalations: {
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
        },
      },
    });

    if (!query) {
      throw new NotFoundError('Query');
    }

    return query;
  } catch (error) {
    logger.error('Error getting query by ID:', error);
    throw error;
  }
};

const createQuery = async (queryData) => {
  try {
    const {
      channelId,
      categoryId,
      subject,
      content,
      senderName,
      senderEmail,
      senderPhone,
      senderId,
      sentiment,
      intent,
      confidence,
      autoTags,
      priority,
      isVip,
      externalId,
      threadId,
      attachments = [],
      metadata,
      skipMLAnalysis = false,
    } = queryData;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new ValidationError('Channel not found');
    }

    let mlAnalysis = null;
    if (!skipMLAnalysis && content) {
      try {
        mlAnalysis = await MLService.analyzeQuery({
          text: content,
          subject: subject,
          senderEmail: senderEmail,
          senderId: senderId,
          channelType: channel.type,
        });
        logger.info('ML analysis completed for new query', {
          category: mlAnalysis.category,
          sentiment: mlAnalysis.sentiment,
          priority: mlAnalysis.priority
        });
      } catch (error) {
        logger.warn('ML analysis failed, using defaults', { error: error.message });
        mlAnalysis = MLService.getDefaultAnalysis();
      }
    }

    const finalSentiment = sentiment || (mlAnalysis?.sentiment || 'NEUTRAL');
    const finalIntent = intent || (mlAnalysis?.intent || null);
    const finalConfidence = confidence ?? (mlAnalysis?.category_confidence || 0.5);
    const finalAutoTags = autoTags || (mlAnalysis?.auto_tags || []);
    const finalIsVip = isVip ?? (mlAnalysis?.is_vip || false);

    let finalPriority = priority;
    if (!finalPriority && mlAnalysis) {
      finalPriority = mlAnalysis.priority;
    }
    if (!finalPriority) {
      finalPriority = detectPriority(content, finalIsVip, finalSentiment);
    }

    let finalCategoryId = categoryId;
    if (!finalCategoryId && mlAnalysis?.category) {

      const category = await prisma.category.findFirst({
        where: {
          name: {
            equals: mlAnalysis.category,
            mode: 'insensitive'
          }
        }
      });
      if (category) {
        finalCategoryId = category.id;
      }
    }

    if (finalCategoryId) {
      const category = await prisma.category.findUnique({
        where: { id: finalCategoryId },
      });

      if (!category) {
        throw new ValidationError('Category not found');
      }
    }

    const isUrgent = mlAnalysis?.is_urgent || finalPriority === 'HIGH' || finalPriority === 'CRITICAL';

    const slaDueAt = calculateSlaDueAt(finalPriority);

    const query = await prisma.query.create({
      data: {
        channelId,
        categoryId: finalCategoryId,
        subject,
        content,
        senderName,
        senderEmail,
        senderPhone,
        senderId,
        sentiment: finalSentiment,
        intent: finalIntent,
        confidence: finalConfidence,
        autoTags: finalAutoTags,
        priority: finalPriority,
        isVip: finalIsVip,
        isUrgent: isUrgent,
        externalId,
        threadId,
        attachments,
        metadata: metadata || {},
        slaDueAt,
      },
      include: {
        channel: true,
        category: true,
      },
    });

    return query;
  } catch (error) {
    logger.error('Error creating query:', error);
    throw error;
  }
};

const updateQuery = async (queryId, updateData) => {
  try {
    const query = await getQueryById(queryId);

    if (updateData.priority && updateData.priority !== query.priority) {
      updateData.slaDueAt = calculateSlaDueAt(updateData.priority);
    }

    const updatedQuery = await prisma.query.update({
      where: { id: queryId },
      data: updateData,
      include: {
        channel: true,
        category: true,
        assignments: {
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
        },
      },
    });

    return updatedQuery;
  } catch (error) {
    logger.error('Error updating query:', error);
    throw error;
  }
};

const deleteQuery = async (queryId) => {
  try {
    await getQueryById(queryId);

    await prisma.query.delete({
      where: { id: queryId },
    });

    return { message: 'Query deleted successfully' };
  } catch (error) {
    logger.error('Error deleting query:', error);
    throw error;
  }
};

const assignQuery = async (queryId, userId, assignedBy, notes) => {
  try {
    const query = await getQueryById(queryId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        queryId,
        userId,
      },
    });

    if (existingAssignment) {
      throw new ValidationError('Query is already assigned to this user');
    }

    const assignment = await prisma.assignment.create({
      data: {
        queryId,
        userId,
        assignedBy,
        notes,
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

    if (query.status === 'NEW') {
      await prisma.query.update({
        where: { id: queryId },
        data: {
          status: 'ASSIGNED',
          assignedAt: new Date(),
        },
      });
    }

    return assignment;
  } catch (error) {
    logger.error('Error assigning query:', error);
    throw error;
  }
};

module.exports = {
  getQueries,
  getQueryById,
  createQuery,
  updateQuery,
  deleteQuery,
  assignQuery,
};

