const axios = require('axios');
const BaseIntegration = require('./baseIntegration');
const queryService = require('../queryService');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

class FacebookIntegration extends BaseIntegration {
  constructor(channelId, configuration) {
    super(channelId, configuration);
    this.apiVersion = 'v18.0';
    this.pageAccessToken = null;
    this.appSecret = null;
    this.pageId = null;
    this.webhookVerifyToken = null;
    this.pollInterval = null;
  }

  async initialize() {
    try {
      const {
        pageAccessToken,
        appSecret,
        pageId,
        webhookVerifyToken = 'my_verify_token',
      } = this.configuration;

      if (!pageAccessToken || !pageId) {
        throw new Error('Missing required Facebook configuration: pageAccessToken, pageId');
      }

      this.pageAccessToken = pageAccessToken;
      this.appSecret = appSecret;
      this.pageId = pageId;
      this.webhookVerifyToken = webhookVerifyToken;

      logger.info('Facebook integration initialized');
      return true;
    } catch (error) {
      logger.error('Error initializing Facebook integration:', error);
      throw error;
    }
  }

  async start() {
    if (this.isActive) {
      logger.warn('Facebook integration is already active');
      return;
    }

    try {
      await this.initialize();

      await this.pollMessages();

      this.pollInterval = setInterval(() => {
        this.pollMessages().catch((err) => {
          logger.error('Error polling Facebook:', err);
        });
      }, 5 * 60 * 1000);

      this.isActive = true;
      logger.info(`Facebook integration started for channel ${this.channelId}`);
    } catch (error) {
      logger.error('Error starting Facebook integration:', error);
      throw error;
    }
  }

  async pollMessages() {
    try {

      await this.pollPageMessages();

      await this.pollPageComments();

      this.lastPollTime = new Date();
    } catch (error) {
      logger.error('Error polling Facebook messages:', error);
      throw error;
    }
  }

  async pollPageMessages() {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.pageId}/conversations`;
      const response = await axios.get(url, {
        params: {
          access_token: this.pageAccessToken,
          fields: 'messages{id,message,from,created_time},participants',
          limit: 25,
        },
      });

      for (const conversation of response.data.data || []) {
        if (conversation.messages?.data) {
          for (const message of conversation.messages.data) {
            await this.processMessage(message, conversation);
          }
        }
      }
    } catch (error) {
      logger.error('Error polling Facebook messages:', error);
    }
  }

  async pollPageComments() {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.pageId}/posts`;
      const response = await axios.get(url, {
        params: {
          access_token: this.pageAccessToken,
          fields: 'id,comments{id,message,from,created_time}',
          limit: 25,
        },
      });

      for (const post of response.data.data || []) {
        if (post.comments?.data) {
          for (const comment of post.comments.data) {
            await this.processComment(comment, post.id);
          }
        }
      }
    } catch (error) {
      logger.error('Error polling Facebook comments:', error);
    }
  }

  async processMessage(message, conversation) {
    try {
      const messageId = message.id;

      const existing = await prisma.query.findUnique({
        where: { externalId: messageId },
      });

      if (existing) {
        return;
      }

      const sender = message.from;
      const content = message.message || '';

      const query = await queryService.createQuery({
        channelId: this.channelId,
        subject: `Facebook message from ${sender.name || 'Unknown'}`,
        content: content,
        senderName: sender.name || 'Unknown',
        senderId: sender.id,
        externalId: messageId,
        threadId: conversation.id,
        metadata: {
          messageId,
          conversationId: conversation.id,
          createdAt: message.created_time,
          type: 'message',
        },
        skipMLAnalysis: false,
      });

      logger.info(`Created query from Facebook message: ${query.id}`);
      return query;
    } catch (error) {
      logger.error('Error processing Facebook message:', error);
      throw error;
    }
  }

  async processComment(comment, postId) {
    try {
      const commentId = comment.id;

      const existing = await prisma.query.findUnique({
        where: { externalId: commentId },
      });

      if (existing) {
        return;
      }

      const sender = comment.from;
      const content = comment.message || '';

      const query = await queryService.createQuery({
        channelId: this.channelId,
        subject: `Facebook comment from ${sender.name || 'Unknown'}`,
        content: content,
        senderName: sender.name || 'Unknown',
        senderId: sender.id,
        externalId: commentId,
        threadId: postId,
        metadata: {
          commentId,
          postId,
          createdAt: comment.created_time,
          type: 'comment',
        },
        skipMLAnalysis: false,
      });

      logger.info(`Created query from Facebook comment: ${query.id}`);
      return query;
    } catch (error) {
      logger.error('Error processing Facebook comment:', error);
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

      if (entry.messaging) {
        for (const messaging of entry.messaging) {
          if (messaging.message) {
            await this.processWebhookMessage(messaging);
          }
        }
      }

      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'feed' && change.value.item === 'comment') {
            await this.processWebhookComment(change.value);
          }
        }
      }
    } catch (error) {
      logger.error('Error processing Facebook webhook:', error);
      throw error;
    }
  }

  async processWebhookMessage(messaging) {
    const message = messaging.message;
    const sender = messaging.sender;

    await queryService.createQuery({
      channelId: this.channelId,
      subject: `Facebook message from ${sender.id}`,
      content: message.text || '',
      senderId: sender.id,
      externalId: message.mid,
      threadId: messaging.conversation?.id,
      metadata: {
        messageId: message.mid,
        timestamp: messaging.timestamp,
        type: 'webhook_message',
      },
      skipMLAnalysis: false,
    });
  }

  async processWebhookComment(commentData) {
    await queryService.createQuery({
      channelId: this.channelId,
      subject: `Facebook comment from ${commentData.from?.name || 'Unknown'}`,
      content: commentData.message || '',
      senderName: commentData.from?.name,
      senderId: commentData.from?.id,
      externalId: commentData.comment_id,
      threadId: commentData.post_id,
      metadata: {
        commentId: commentData.comment_id,
        postId: commentData.post_id,
        type: 'webhook_comment',
      },
      skipMLAnalysis: false,
    });
  }

  async testConnection() {
    try {
      await this.initialize();
      const url = `https://graph.facebook.com/${this.apiVersion}/me`;
      const response = await axios.get(url, {
        params: {
          access_token: this.pageAccessToken,
        },
      });

      return { success: true, message: `Connected to page: ${response.data.name}` };
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
        throw new Error('Query not found or not from Facebook channel');
      }

      const recipientId = query.senderId;
      if (!recipientId) {
        throw new Error('No sender ID found in query');
      }

      const url = `https://graph.facebook.com/${this.apiVersion}/me/messages`;
      await axios.post(url, {
        recipient: { id: recipientId },
        message: { text: responseContent },
      }, {
        params: {
          access_token: this.pageAccessToken,
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

      logger.info(`Sent Facebook message to ${recipientId}`);
    } catch (error) {
      logger.error('Error sending Facebook response:', error);
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

module.exports = FacebookIntegration;

