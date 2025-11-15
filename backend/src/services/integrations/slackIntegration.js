const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const BaseIntegration = require('./baseIntegration');
const queryService = require('../queryService');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

class SlackIntegration extends BaseIntegration {
  constructor(channelId, configuration) {
    super(channelId, configuration);
    this.client = null;
    this.slackEvents = null;
    this.channelIds = [];
    this.botUserId = null;
  }

  async initialize() {
    try {
      const {
        botToken,
        signingSecret,
        channelIds = [],
      } = this.configuration;

      if (!botToken) {
        throw new Error('Missing required Slack configuration: botToken');
      }

      this.client = new WebClient(botToken);
      this.channelIds = Array.isArray(channelIds) ? channelIds : [channelIds].filter(Boolean);

      const authTest = await this.client.auth.test();
      this.botUserId = authTest.user_id;

      if (signingSecret) {
        this.slackEvents = createEventAdapter(signingSecret);
        this.setupEventHandlers();
      }

      logger.info('Slack integration initialized');
      return true;
    } catch (error) {
      logger.error('Error initializing Slack integration:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    if (!this.slackEvents) return;

    this.slackEvents.on('message', async (event) => {

      if (event.subtype || event.bot_id || event.user === this.botUserId) {
        return;
      }

      if (this.channelIds.length > 0 && !this.channelIds.includes(event.channel)) {
        return;
      }

      await this.processMessage(event);
    });

    this.slackEvents.on('error', (error) => {
      logger.error('Slack events error:', error);
    });
  }

  async start() {
    if (this.isActive) {
      logger.warn('Slack integration is already active');
      return;
    }

    try {
      await this.initialize();

      if (!this.slackEvents) {

        this.pollInterval = setInterval(() => {
          this.pollMessages().catch((err) => {
            logger.error('Error polling Slack messages:', err);
          });
        }, 5 * 60 * 1000);
      }

      this.isActive = true;
      logger.info(`Slack integration started for channel ${this.channelId}`);
    } catch (error) {
      logger.error('Error starting Slack integration:', error);
      throw error;
    }
  }

  async pollMessages() {
    try {

      for (const channelId of this.channelIds) {
        const result = await this.client.conversations.history({
          channel: channelId,
          limit: 20,
        });

        for (const message of result.messages || []) {

          if (message.bot_id || message.subtype) continue;

          await this.processMessage({
            ...message,
            channel: channelId,
            user: message.user,
            text: message.text,
            ts: message.ts,
          });
        }
      }

      this.lastPollTime = new Date();
    } catch (error) {
      logger.error('Error polling Slack messages:', error);
    }
  }

  async processMessage(event) {
    try {
      const messageId = `${event.channel}-${event.ts}`;

      const existing = await prisma.query.findUnique({
        where: { externalId: messageId },
      });

      if (existing) {
        return;
      }

      let userName = 'Unknown';
      let userEmail = null;
      try {
        if (event.user) {
          const userInfo = await this.client.users.info({ user: event.user });
          userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
          userEmail = userInfo.user?.profile?.email;
        }
      } catch (err) {
        logger.debug('Could not fetch user info:', err.message);
      }

      let channelName = event.channel;
      try {
        const channelInfo = await this.client.conversations.info({ channel: event.channel });
        channelName = channelInfo.channel?.name || channelName;
      } catch (err) {
        logger.debug('Could not fetch channel info:', err.message);
      }

      const query = await queryService.createQuery({
        channelId: this.channelId,
        subject: `Slack message in #${channelName} from ${userName}`,
        content: event.text || '',
        senderName: userName,
        senderEmail: userEmail,
        senderId: event.user,
        externalId: messageId,
        threadId: event.channel,
        metadata: {
          messageId: messageId,
          channelId: event.channel,
          channelName: channelName,
          timestamp: event.ts,
          threadTs: event.thread_ts,
          attachments: event.files || [],
        },
        skipMLAnalysis: false,
      });

      logger.info(`Created query from Slack message: ${query.id}`);
      return query;
    } catch (error) {
      logger.error('Error processing Slack message:', error);
      throw error;
    }
  }

  getEventsAdapter() {
    return this.slackEvents;
  }

  async testConnection() {
    try {
      await this.initialize();
      const authTest = await this.client.auth.test();
      return {
        success: true,
        message: `Connected to Slack workspace: ${authTest.team} as @${authTest.user}`
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async sendResponse(queryId, responseContent, attachments = []) {
    try {
      const query = await prisma.query.findUnique({
        where: { id: queryId },
        include: { channel: true },
      });

      if (!query || query.channelId !== this.channelId) {
        throw new Error('Query not found or not from Slack channel');
      }

      const channelId = query.metadata?.channelId || query.threadId;
      if (!channelId) {
        throw new Error('No channel ID found in query metadata');
      }

      const messageOptions = {
        channel: channelId,
        text: responseContent,
      };

      if (query.metadata?.threadTs) {
        messageOptions.thread_ts = query.metadata.threadTs;
      }

      const result = await this.client.chat.postMessage(messageOptions);

      await prisma.response.create({
        data: {
          queryId,
          userId: query.assignments[0]?.userId || null,
          content: responseContent,
          isInternal: false,
        },
      });

      logger.info(`Sent Slack message: ${result.ts}`);
      return result;
    } catch (error) {
      logger.error('Error sending Slack response:', error);
      throw error;
    }
  }

  async stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.slackEvents) {
      await this.slackEvents.stop();
      this.slackEvents = null;
    }

    await super.stop();
  }
}

module.exports = SlackIntegration;

