const integrationManager = require('../services/integrationManager');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const startIntegration = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  await integrationManager.startChannel(channelId);

  res.status(200).json({
    status: 'success',
    message: 'Integration started successfully',
  });
});

const stopIntegration = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  await integrationManager.stopChannel(channelId);

  res.status(200).json({
    status: 'success',
    message: 'Integration stopped successfully',
  });
});

const testConnection = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const result = await integrationManager.testChannelConnection(channelId);

  res.status(200).json({
    status: result.success ? 'success' : 'error',
    message: result.message,
    data: result,
  });
});

const getIntegrationStatus = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const integration = integrationManager.getIntegration(channelId);

  if (!integration) {
    return res.status(404).json({
      status: 'error',
      message: 'Integration not found or not active',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      status: integration.getStatus(),
    },
  });
});

const getAllIntegrationStatuses = asyncHandler(async (req, res) => {
  const statuses = integrationManager.getStatus();

  res.status(200).json({
    status: 'success',
    data: {
      integrations: statuses,
    },
  });
});

const reloadIntegration = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  await integrationManager.reloadChannel(channelId);

  res.status(200).json({
    status: 'success',
    message: 'Integration reloaded successfully',
  });
});

module.exports = {
  startIntegration,
  stopIntegration,
  testConnection,
  getIntegrationStatus,
  getAllIntegrationStatuses,
  reloadIntegration,
};

