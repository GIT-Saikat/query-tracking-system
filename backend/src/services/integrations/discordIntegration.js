const { Client, GatewayIntentBits, Events } = require('discord.js');
const BaseIntegration = require('./baseIntegration');
const queryService = require('../queryService');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

class DiscordIntegration extends BaseIntegration {
  constructor(channelId, configuration) {
    super(channelId, configuration);
    this.client = null;
    this.guildId = null;
    this.channelIds = [];
  }

  async initialize() {
    try {
      const {
        botToken,
        guildId,
        channelIds = [],
      } = this.configuration;

      if (!botToken) {
        throw new Error('Missing required Discord configuration: botToken');
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.DirectMessages,
        ],
      });

      this.guildId = guildId;
      this.channelIds = Array.isArray(channelIds) ? channelIds : [channelIds].filter(Boolean);

      this.setupEventHandlers();

      logger.info('Discord integration initialized');
      return true;
    } catch (error) {
      logger.error('Error initializing Discord integration:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    this.client.once(Events.ClientReady, () => {
      logger.info(`Discord bot ready! Logged in as ${this.client.user.tag}`);
    });

    this.client.on(Events.MessageCreate, async (message) => {

      if (message.author.bot) return;

      if (this.channelIds.length > 0 && !this.channelIds.includes(message.channel.id)) {
        return;
      }

      if (this.guildId && message.guild?.id !== this.guildId) {
        return;
      }

      await this.processMessage(message);
    });

    this.client.on(Events.Error, (error) => {
      logger.error('Discord client error:', error);
    });
  }

  async start() {
    if (this.isActive) {
      logger.warn('Discord integration is already active');
      return;
    }

    try {
      await this.initialize();
      await this.client.login(this.configuration.botToken);

      this.isActive = true;
      logger.info(`Discord integration started for channel ${this.channelId}`);
    } catch (error) {
      logger.error('Error starting Discord integration:', error);
      throw error;
    }
  }

  async processMessage(message) {
    try {
      const messageId = message.id;

      const existing = await prisma.query.findUnique({
        where: { externalId: messageId },
      });

      if (existing) {
        return;
      }

      const content = message.content || '';
      const author = message.author;
      const channel = message.channel;

      const channelName = channel.type === 1 ? 'DM' : channel.name;
      const subject = `Discord message in #${channelName} from ${author.username}`;

      const query = await queryService.createQuery({
        channelId: this.channelId,
        subject: subject,
        content: content,
        senderName: author.username || author.displayName || 'Unknown',
        senderId: author.id,
        externalId: messageId,
        threadId: channel.id,
        metadata: {
          messageId,
          channelId: channel.id,
          channelName: channelName,
          guildId: message.guild?.id,
          guildName: message.guild?.name,
          createdAt: message.createdAt.toISOString(),
          attachments: message.attachments.map((att) => ({
            url: att.url,
            filename: att.name,
            size: att.size,
          })),
        },
        skipMLAnalysis: false,
      });

      logger.info(`Created query from Discord message: ${query.id}`);
      return query;
    } catch (error) {
      logger.error('Error processing Discord message:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.initialize();
      await this.client.login(this.configuration.botToken);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const username = this.client.user?.tag || 'Unknown';
      await this.client.destroy();

      return { success: true, message: `Discord bot connected as ${username}` };
    } catch (error) {
      if (this.client) {
        await this.client.destroy().catch(() => {});
      }
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
        throw new Error('Query not found or not from Discord channel');
      }

      const channelId = query.metadata?.channelId || query.threadId;
      if (!channelId) {
        throw new Error('No channel ID found in query metadata');
      }

      const channel = await this.client.channels.fetch(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      const messageOptions = { content: responseContent };
      if (query.externalId) {

        try {
          const originalMessage = await channel.messages.fetch(query.externalId);
          messageOptions.reply = { messageReference: originalMessage };
        } catch (err) {

          logger.debug('Could not fetch original message for reply');
        }
      }

      const sentMessage = await channel.send(messageOptions);

      await prisma.response.create({
        data: {
          queryId,
          userId: query.assignments[0]?.userId || null,
          content: responseContent,
          isInternal: false,
        },
      });

      logger.info(`Sent Discord message: ${sentMessage.id}`);
      return sentMessage;
    } catch (error) {
      logger.error('Error sending Discord response:', error);
      throw error;
    }
  }

  async stop() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }

    await super.stop();
  }
}

module.exports = DiscordIntegration;

