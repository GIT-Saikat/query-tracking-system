const prisma = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const getChannels = async (filters = {}) => {
  try {
    const { isActive, search } = filters;

    const where = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const channels = await prisma.channel.findMany({
      where,
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

    return { channels };
  } catch (error) {
    logger.error('Error getting channels:', error);
    throw error;
  }
};

const getChannelById = async (channelId) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        _count: {
          select: {
            queries: true,
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundError('Channel');
    }

    return channel;
  } catch (error) {
    logger.error('Error getting channel by ID:', error);
    throw error;
  }
};

const createChannel = async (channelData) => {
  try {
    const channel = await prisma.channel.create({
      data: channelData,
    });

    return channel;
  } catch (error) {
    logger.error('Error creating channel:', error);
    throw error;
  }
};

const updateChannel = async (channelId, updateData) => {
  try {
    await getChannelById(channelId);

    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: updateData,
    });

    return updatedChannel;
  } catch (error) {
    logger.error('Error updating channel:', error);
    throw error;
  }
};

const deleteChannel = async (channelId) => {
  try {
    await getChannelById(channelId);

    await prisma.channel.delete({
      where: { id: channelId },
    });

    return { message: 'Channel deleted successfully' };
  } catch (error) {
    logger.error('Error deleting channel:', error);
    throw error;
  }
};

module.exports = {
  getChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
};

