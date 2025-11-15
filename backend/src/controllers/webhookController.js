const integrationManager = require('../services/integrationManager');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const prisma = require('../config/database');

const handleFacebookWebhook = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token']) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return res.status(404).send('Channel not found');
    }

    const integration = integrationManager.getIntegration(channelId);
    if (!integration) {
      return res.status(404).send('Integration not active');
    }

    const isValid = integration.verifyWebhook(
      req.query['hub.mode'],
      req.query['hub.verify_token']
    );

    if (isValid) {
      return res.status(200).send(req.query['hub.challenge']);
    } else {
      return res.status(403).send('Verification failed');
    }
  }

  if (req.body.entry) {
    const integration = integrationManager.getIntegration(channelId);
    if (integration && integration.processWebhookEvent) {
      await integration.processWebhookEvent(req.body);
    }
  }

  res.status(200).send('OK');
});

const handleInstagramWebhook = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token']) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return res.status(404).send('Channel not found');
    }

    const integration = integrationManager.getIntegration(channelId);
    if (!integration) {
      return res.status(404).send('Integration not active');
    }

    const isValid = integration.verifyWebhook(
      req.query['hub.mode'],
      req.query['hub.verify_token']
    );

    if (isValid) {
      return res.status(200).send(req.query['hub.challenge']);
    } else {
      return res.status(403).send('Verification failed');
    }
  }

  if (req.body.entry) {
    const integration = integrationManager.getIntegration(channelId);
    if (integration && integration.processWebhookEvent) {
      await integration.processWebhookEvent(req.body);
    }
  }

  res.status(200).send('OK');
});

const handleSlackWebhook = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const integration = integrationManager.getIntegration(channelId);
  if (!integration) {
    return res.status(404).json({ error: 'Integration not active' });
  }

  const eventsAdapter = integration.getEventsAdapter();
  if (!eventsAdapter) {
    return res.status(400).json({ error: 'Slack events adapter not configured' });
  }

  res.status(200).send('OK');
});

const handleGenericWebhook = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { type, data } = req.body;

  logger.info(`Received webhook for channel ${channelId}: ${type}`);

  const integration = integrationManager.getIntegration(channelId);
  if (!integration) {
    return res.status(404).json({
      status: 'error',
      message: 'Integration not active for this channel',
    });
  }

  if (integration.processWebhookEvent) {
    await integration.processWebhookEvent({ type, data });
  }

  res.status(200).json({
    status: 'success',
    message: 'Webhook processed',
  });
});

module.exports = {
  handleFacebookWebhook,
  handleInstagramWebhook,
  handleSlackWebhook,
  handleGenericWebhook,
};

