const prisma = require('../config/database');
const logger = require('../utils/logger');
const EmailIntegration = require('./integrations/emailIntegration');
const TwitterIntegration = require('./integrations/twitterIntegration');
const FacebookIntegration = require('./integrations/facebookIntegration');
const InstagramIntegration = require('./integrations/instagramIntegration');
const DiscordIntegration = require('./integrations/discordIntegration');
const SlackIntegration = require('./integrations/slackIntegration');

class IntegrationManager {
  constructor() {
    this.integrations = new Map();
  }

  getIntegrationClass(channelType) {
    const integrationMap = {
      EMAIL: EmailIntegration,
      TWITTER: TwitterIntegration,
      FACEBOOK: FacebookIntegration,
      INSTAGRAM: InstagramIntegration,
      DISCORD: DiscordIntegration,
      SLACK: SlackIntegration,
    };

    return integrationMap[channelType];
  }

  async initializeChannel(channelId) {
    try {
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      if (!channel.isActive) {
        logger.info(`Channel ${channelId} is not active, skipping integration`);
        return null;
      }

      const IntegrationClass = this.getIntegrationClass(channel.type);
      if (!IntegrationClass) {
        logger.warn(`No integration available for channel type: ${channel.type}`);
        return null;
      }

      const configuration = channel.configuration || {};
      const integration = new IntegrationClass(channelId, configuration);

      this.integrations.set(channelId, integration);
      logger.info(`Integration initialized for channel ${channelId} (${channel.type})`);

      return integration;
    } catch (error) {
      logger.error(`Error initializing integration for channel ${channelId}:`, error);
      throw error;
    }
  }

  async startChannel(channelId) {
    try {
      let integration = this.integrations.get(channelId);

      if (!integration) {
        integration = await this.initializeChannel(channelId);
        if (!integration) {
          throw new Error('Failed to initialize integration');
        }
      }

      await integration.start();
      logger.info(`Integration started for channel ${channelId}`);
      return integration;
    } catch (error) {
      logger.error(`Error starting integration for channel ${channelId}:`, error);
      throw error;
    }
  }

  async stopChannel(channelId) {
    try {
      const integration = this.integrations.get(channelId);
      if (!integration) {
        logger.warn(`No active integration found for channel ${channelId}`);
        return;
      }

      await integration.stop();
      this.integrations.delete(channelId);
      logger.info(`Integration stopped for channel ${channelId}`);
    } catch (error) {
      logger.error(`Error stopping integration for channel ${channelId}:`, error);
      throw error;
    }
  }

  getIntegration(channelId) {
    return this.integrations.get(channelId);
  }

  async testChannelConnection(channelId) {
    try {
      const integration = await this.initializeChannel(channelId);
      if (!integration) {
        return { success: false, message: 'Integration not available for this channel type' };
      }

      const result = await integration.testConnection();

      await integration.stop().catch(() => {});
      this.integrations.delete(channelId);

      return result;
    } catch (error) {
      logger.error(`Error testing connection for channel ${channelId}:`, error);
      return { success: false, message: error.message };
    }
  }

  getStatus() {
    const status = [];
    for (const [channelId, integration] of this.integrations.entries()) {
      status.push(integration.getStatus());
    }
    return status;
  }

  async startAllActiveChannels() {
    try {
      const channels = await prisma.channel.findMany({
        where: { isActive: true },
      });

      logger.info(`Starting integrations for ${channels.length} active channels`);

      for (const channel of channels) {
        try {
          await this.startChannel(channel.id);
        } catch (error) {
          logger.error(`Failed to start integration for channel ${channel.id}:`, error);
        }
      }

      logger.info('Finished starting channel integrations');
    } catch (error) {
      logger.error('Error starting all channel integrations:', error);
      throw error;
    }
  }

  async stopAll() {
    logger.info('Stopping all integrations...');

    const channelIds = Array.from(this.integrations.keys());
    for (const channelId of channelIds) {
      try {
        await this.stopChannel(channelId);
      } catch (error) {
        logger.error(`Error stopping channel ${channelId}:`, error);
      }
    }

    logger.info('All integrations stopped');
  }

  async reloadChannel(channelId) {
    try {
      await this.stopChannel(channelId);
      await this.startChannel(channelId);
      logger.info(`Integration reloaded for channel ${channelId}`);
    } catch (error) {
      logger.error(`Error reloading integration for channel ${channelId}:`, error);
      throw error;
    }
  }
}

const integrationManager = new IntegrationManager();

module.exports = integrationManager;

