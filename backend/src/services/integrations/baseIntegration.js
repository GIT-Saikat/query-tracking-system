const logger = require('../../utils/logger');

class BaseIntegration {
  constructor(channelId, configuration) {
    this.channelId = channelId;
    this.configuration = configuration || {};
    this.isActive = false;
    this.lastPollTime = null;
  }

  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  async start() {
    throw new Error('start() must be implemented by subclass');
  }

  async stop() {
    this.isActive = false;
    logger.info(`Integration stopped for channel ${this.channelId}`);
  }

  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  async processMessage(messageData) {
    throw new Error('processMessage() must be implemented by subclass');
  }

  async sendResponse(queryId, responseContent, attachments = []) {
    throw new Error('sendResponse() must be implemented by subclass');
  }

  getStatus() {
    return {
      channelId: this.channelId,
      isActive: this.isActive,
      lastPollTime: this.lastPollTime,
      configuration: this.configuration ? Object.keys(this.configuration) : [],
    };
  }
}

module.exports = BaseIntegration;

