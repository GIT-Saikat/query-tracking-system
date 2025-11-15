const channelService = require('../services/channelService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all channels
 */
const getChannels = asyncHandler(async (req, res) => {
  const filters = {
    isActive: req.query.isActive,
    search: req.query.search,
  };

  const result = await channelService.getChannels(filters);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Get channel by ID
 */
const getChannelById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const channel = await channelService.getChannelById(id);

  res.status(200).json({
    status: 'success',
    data: { channel },
  });
});

/**
 * Create channel
 */
const createChannel = asyncHandler(async (req, res) => {
  const channel = await channelService.createChannel(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Channel created successfully',
    data: { channel },
  });
});

/**
 * Update channel
 */
const updateChannel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const channel = await channelService.updateChannel(id, req.body);

  res.status(200).json({
    status: 'success',
    message: 'Channel updated successfully',
    data: { channel },
  });
});

/**
 * Delete channel
 */
const deleteChannel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await channelService.deleteChannel(id);

  res.status(200).json({
    status: 'success',
    message: 'Channel deleted successfully',
  });
});

module.exports = {
  getChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
};

