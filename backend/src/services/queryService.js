const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Calculate SLA due date based on priority
 */
const calculateSlaDueAt = (priority) => {
  const hours = config.slaTimes[priority] || config.slaTimes.MEDIUM;
  const dueDate = new Date();
  dueDate.setHours(dueDate.getHours() + hours);
  return dueDate;
};

/**
 * Auto-detect priority based on content and metadata
 */
const detectPriority = (content, isVip = false, sentiment = 'NEUTRAL') => {
  // VIP customers get higher priority
  if (isVip) {
    return 'HIGH';
  }

  // Negative sentiment gets higher priority
  if (sentiment === 'NEGATIVE') {
    return 'HIGH';
  }

  // Check for urgent keywords
  const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'broken', 'down'];
  const contentLower = content.toLowerCase();
  
  if (urgentKeywords.some(keyword => contentLower.includes(keyword))) {
    return 'HIGH';
  }

  // Default to medium
  return 'MEDIUM';
};

/**
 * Get all queries with filters
 */
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

    // Build where clause
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

    // If userId is provided, filter by assigned queries
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

/**
 * Get query by ID
 */
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

/**
 * Create a new query
 */
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
      sentiment = 'NEUTRAL',
      intent,
      confidence,
      autoTags = [],
      priority,
      isVip = false,
      externalId,
      threadId,
      attachments = [],
      metadata,
    } = queryData;

    // Verify channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new ValidationError('Channel not found');
    }

    // Verify category if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new ValidationError('Category not found');
      }
    }

    // Auto-detect priority if not provided
    const detectedPriority = priority || detectPriority(content, isVip, sentiment);

    // Calculate SLA due date
    const slaDueAt = calculateSlaDueAt(detectedPriority);

    // Create query
    const query = await prisma.query.create({
      data: {
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
        priority: detectedPriority,
        isVip,
        isUrgent: detectedPriority === 'HIGH' || detectedPriority === 'CRITICAL',
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

/**
 * Update query
 */
const updateQuery = async (queryId, updateData) => {
  try {
    const query = await getQueryById(queryId);

    // Recalculate SLA if priority is being updated
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

/**
 * Delete query
 */
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

/**
 * Assign query to user
 */
const assignQuery = async (queryId, userId, assignedBy, notes) => {
  try {
    const query = await getQueryById(queryId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if already assigned
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        queryId,
        userId,
      },
    });

    if (existingAssignment) {
      throw new ValidationError('Query is already assigned to this user');
    }

    // Create assignment
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

    // Update query status if it's NEW
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

