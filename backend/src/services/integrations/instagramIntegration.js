const axios = require('axios');
const BaseIntegration = require('./baseIntegration');
const queryService = require('../queryService');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

class InstagramIntegration extends BaseIntegration {
  constructor(channelId, configuration) {
    super(channelId, configuration);
    this.apiVersion = 'v18.0';
    this.accessToken = null;
    this.instagramBusinessAccountId = null;
    this.webhookVerifyToken = null;
    this.pollInterval = null;
  }

  async initialize() {
    try {
      const {
        accessToken,
        instagramBusinessAccountId,
        webhookVerifyToken = 'my_verify_token',
      } = this.configuration;

      if (!accessToken || !instagramBusinessAccountId) {
        throw new Error('Missing required Instagram configuration: accessToken, instagramBusinessAccountId');
      }

      this.accessToken = accessToken;
      this.instagramBusinessAccountId = instagramBusinessAccountId;
      this.webhookVerifyToken = webhookVerifyToken;

      logger.info('Instagram integration initialized');
      return true;
    } catch (error) {
      logger.error('Error initializing Instagram integration:', error);
      throw error;
    }
  }

  async start() {
    if (this.isActive) {
      logger.warn('Instagram integration is already active');
      return;
    }

    try {
      await this.initialize();

      await this.pollComments();
      await this.pollDirectMessages();

      this.pollInterval = setInterval(() => {
        this.pollComments().catch((err) => {
          logger.error('Error polling Instagram comments:', err);
        });
        this.pollDirectMessages().catch((err) => {
          logger.error('Error polling Instagram DMs:', err);
        });
      }, 5 * 60 * 1000);

      this.isActive = true;
      logger.info(`Instagram integration started for channel ${this.channelId}`);
    } catch (error) {
      logger.error('Error starting Instagram integration:', error);
      throw error;
    }
  }

  async pollComments() {
    try {

      const mediaUrl = `https://graph.facebook.com/${this.apiVersion}/${this.instagramBusinessAccountId}/media`;
      const mediaResponse = await axios.get(mediaUrl, {
        params: {
          access_token: this.accessToken,
          fields: 'id,caption,comments_count',
          limit: 25,
        },
      });

      for (const media of mediaResponse.data.data || []) {

        const commentsUrl = `https://graph.facebook.com/${this.apiVersion}/${media.id}/comments`;
        const commentsResponse = await axios.get(commentsUrl, {
          params: {
            access_token: this.accessToken,
            fields: 'id,text,username,timestamp',
          },
        });

        for (const comment of commentsResponse.data.data || []) {
          await this.processComment(comment, media.id);
        }
      }

      this.lastPollTime = new Date();
    } catch (error) {
      logger.error('Error polling Instagram comments:', error);
    }
  }

  async pollDirectMessages() {
    try {

      const conversationsUrl = `https://graph.facebook.com/${this.apiVersion}/${this.instagramBusinessAccountId}/conversations`;

      const response = await axios.get(conversationsUrl, {
        params: {
          access_token: this.accessToken,
          fields: 'id,participants,messages{id,text,from,timestamp}',
          limit: 25,
        },
      });

      for (const conversation of response.data.data || []) {
        if (conversation.messages?.data) {
          for (const message of conversation.messages.data) {
            await this.processDirectMessage(message, conversation.id);
          }
        }
      }
    } catch (error) {

      logger.debug('Instagram DM polling not available:', error.message);
    }
  }

  async processComment(comment, mediaId) {
    try {
      const commentId = comment.id;

      const existing = await prisma.query.findUnique({
        where: { externalId: commentId },
      });

      if (existing) {
        return;
      }

      const query = await queryService.createQuery({
        channelId: this.channelId,
        subject: `Instagram comment from @${comment.username || 'unknown'}`,
        content: comment.text || '',
        senderName: comment.username || 'Unknown',
        senderId: comment.username,
        externalId: commentId,
        threadId: mediaId,
        metadata: {
          commentId,
          mediaId,
          timestamp: comment.timestamp,
          type: 'comment',
        },
        skipMLAnalysis: false,
      });

      logger.info(`Created query from Instagram comment: ${query.id}`);
      return query;
    } catch (error) {
      logger.error('Error processing Instagram comment:', error);
      throw error;
    }
  }

  async processDirectMessage(message, conversationId) {
    try {
      const messageId = message.id;

      const existing = await prisma.query.findUnique({
        where: { externalId: messageId },
      });

      if (existing) {
        return;
      }

      const query = await queryService.createQuery({
        channelId: this.channelId,
        subject: `Instagram DM from ${message.from?.username || 'unknown'}`,
        content: message.text || '',
        senderName: message.from?.username || 'Unknown',
        senderId: message.from?.id,
        externalId: messageId,
        threadId: conversationId,
        metadata: {
          messageId,
          conversationId,
          timestamp: message.timestamp,
          type: 'direct_message',
        },
        skipMLAnalysis: false,
      });

      logger.info(`Created query from Instagram DM: ${query.id}`);
      return query;
    } catch (error) {
      logger.error('Error processing Instagram DM:', error);
      throw error;
    }
  }

  verifyWebhook(mode, token) {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      return true;
    }
    return false;
  }

  async processWebhookEvent(event) {
    try {
      const entry = event.entry?.[0];
      if (!entry) return;

      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            await this.processWebhookComment(change.value);
          }
        }
      }
    } catch (error) {
      logger.error('Error processing Instagram webhook:', error);
      throw error;
    }
  }

  async processWebhookComment(commentData) {
    await queryService.createQuery({
      channelId: this.channelId,
      subject: `Instagram comment from ${commentData.from?.username || 'Unknown'}`,
      content: commentData.text || '',
      senderName: commentData.from?.username,
      senderId: commentData.from?.id,
      externalId: commentData.id,
      threadId: commentData.media?.id,
      metadata: {
        commentId: commentData.id,
        mediaId: commentData.media?.id,
        type: 'webhook_comment',
      },
      skipMLAnalysis: false,
    });
  }

  async testConnection() {
    try {
      await this.initialize();
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.instagramBusinessAccountId}`;
      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          fields: 'username,account_type',
        },
      });

      return { success: true, message: `Connected to Instagram account: @${response.data.username}` };
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
        throw new Error('Query not found or not from Instagram channel');
      }

      const commentId = query.metadata?.commentId || query.externalId;
      if (!commentId) {
        throw new Error('No comment ID found in query metadata');
      }

      const url = `https://graph.facebook.com/${this.apiVersion}/${commentId}/replies`;
      await axios.post(url, {
        message: responseContent,
      }, {
        params: {
          access_token: this.accessToken,
        },
      });

      await prisma.response.create({
        data: {
          queryId,
          userId: query.assignments[0]?.userId || null,
          content: responseContent,
          isInternal: false,
        },
      });

      logger.info(`Sent Instagram comment reply to ${commentId}`);
    } catch (error) {
      logger.error('Error sending Instagram response:', error);
      throw error;
    }
  }

  async stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    await super.stop();
  }
}

module.exports = InstagramIntegration;

