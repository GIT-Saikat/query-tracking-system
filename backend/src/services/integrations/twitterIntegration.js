const { TwitterApi } = require('twitter-api-v2');
const BaseIntegration = require('./baseIntegration');
const queryService = require('../queryService');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

class TwitterIntegration extends BaseIntegration {
  constructor(channelId, configuration) {
    super(channelId, configuration);
    this.client = null;
    this.streamRules = [];
    this.stream = null;
  }

  async initialize() {
    try {
      const {
        bearerToken,
        apiKey,
        apiSecret,
        accessToken,
        accessTokenSecret,
      } = this.configuration;

      if (!bearerToken && (!apiKey || !apiSecret)) {
        throw new Error('Missing Twitter API credentials');
      }

      if (bearerToken) {
        this.client = new TwitterApi(bearerToken);
      } else {
        this.client = new TwitterApi({
          appKey: apiKey,
          appSecret: apiSecret,
          accessToken,
          accessSecret: accessTokenSecret,
        });
      }

      if (accessToken && accessTokenSecret) {
        this.rwClient = this.client.readWrite;
      } else {
        this.rwClient = this.client.readOnly;
      }

      logger.info('Twitter integration initialized');
      return true;
    } catch (error) {
      logger.error('Error initializing Twitter integration:', error);
      throw error;
    }
  }

  async start() {
    if (this.isActive) {
      logger.warn('Twitter integration is already active');
      return;
    }

    try {
      await this.initialize();

      await this.setupMentionStream();

      this.dmPollInterval = setInterval(() => {
        this.pollDirectMessages().catch((err) => {
          logger.error('Error polling DMs:', err);
        });
      }, 5 * 60 * 1000);

      this.isActive = true;
      logger.info(`Twitter integration started for channel ${this.channelId}`);
    } catch (error) {
      logger.error('Error starting Twitter integration:', error);
      throw error;
    }
  }

  async setupMentionStream() {
    try {
      const { username } = this.configuration;
      if (!username) {
        logger.warn('Twitter username not configured, skipping mention stream');
        return;
      }

      const user = await this.client.v2.userByUsername(username);
      const userId = user.data.id;

      const rules = await this.client.v2.streamRules();

      const mentionRule = `@${username} -is:retweet`;
      const existingRule = rules.data?.find((r) => r.value === mentionRule);

      if (!existingRule) {
        await this.client.v2.updateStreamRules({
          add: [{ value: mentionRule, tag: 'mentions' }],
        });
      }

      this.stream = await this.client.v2.searchStream({
        expansions: ['author_id', 'in_reply_to_user_id'],
        'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'in_reply_to_user_id'],
        'user.fields': ['username', 'name'],
      });

      this.stream.on('data', async (tweet) => {
        await this.processTweet(tweet);
      });

      this.stream.on('error', (error) => {
        logger.error('Twitter stream error:', error);
      });

      logger.info('Twitter mention stream started');
    } catch (error) {
      logger.error('Error setting up Twitter stream:', error);
      throw error;
    }
  }

  async processTweet(tweet) {
    try {
      const tweetId = tweet.data.id;
      const tweetText = tweet.data.text;
      const authorId = tweet.data.author_id;
      const author = tweet.includes?.users?.find((u) => u.id === authorId);

      const existing = await prisma.query.findUnique({
        where: { externalId: tweetId },
      });

      if (existing) {
        logger.debug(`Tweet ${tweetId} already processed`);
        return;
      }

      const query = await queryService.createQuery({
        channelId: this.channelId,
        subject: `Twitter mention from @${author?.username || 'unknown'}`,
        content: tweetText,
        senderName: author?.name || author?.username || 'Unknown',
        senderId: authorId,
        externalId: tweetId,
        threadId: tweet.data.conversation_id,
        metadata: {
          tweetId,
          authorId,
          username: author?.username,
          createdAt: tweet.data.created_at,
          isReply: !!tweet.data.in_reply_to_user_id,
        },
        skipMLAnalysis: false,
      });

      logger.info(`Created query from Twitter mention: ${query.id}`);
      return query;
    } catch (error) {
      logger.error('Error processing tweet:', error);
      throw error;
    }
  }

  async pollDirectMessages() {
    try {

      logger.debug('Polling for Twitter DMs (requires elevated API access)');

    } catch (error) {
      logger.error('Error polling DMs:', error);
    }
  }

  async testConnection() {
    try {
      await this.initialize();
      const me = await this.rwClient.v2.me();
      return { success: true, message: `Connected as @${me.data.username}` };
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
        throw new Error('Query not found or not from Twitter channel');
      }

      const tweetId = query.metadata?.tweetId || query.externalId;
      if (!tweetId) {
        throw new Error('No tweet ID found in query metadata');
      }

      const reply = await this.rwClient.v2.reply(responseContent, tweetId);

      await prisma.response.create({
        data: {
          queryId,
          userId: query.assignments[0]?.userId || null,
          content: responseContent,
          isInternal: false,
        },
      });

      logger.info(`Sent Twitter reply: ${reply.data.id}`);
      return reply;
    } catch (error) {
      logger.error('Error sending Twitter response:', error);
      throw error;
    }
  }

  async stop() {
    if (this.dmPollInterval) {
      clearInterval(this.dmPollInterval);
      this.dmPollInterval = null;
    }

    if (this.stream) {
      await this.stream.close();
      this.stream = null;
    }

    await super.stop();
  }
}

module.exports = TwitterIntegration;

