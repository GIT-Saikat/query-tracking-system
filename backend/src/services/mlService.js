/**
 * ML Service Integration
 * Handles communication with the ML/AI service for query analysis
 */
const axios = require('axios');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || '10000');

class MLService {
  /**
   * Analyze a query using the ML service
   * @param {Object} queryData - Query data to analyze
   * @param {string} queryData.text - Query content
   * @param {string} [queryData.subject] - Query subject
   * @param {string} [queryData.senderEmail] - Sender email
   * @param {string} [queryData.senderId] - Sender ID
   * @param {string} [queryData.channelType] - Channel type
   * @returns {Promise<Object>} Analysis results
   */
  static async analyzeQuery(queryData) {
    try {
      const response = await axios.post(
        `${ML_SERVICE_URL}/analyze`,
        {
          text: queryData.text || '',
          subject: queryData.subject,
          sender_email: queryData.senderEmail,
          sender_id: queryData.senderId,
          channel_type: queryData.channelType
        },
        {
          timeout: ML_SERVICE_TIMEOUT,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        logger.info('ML service analysis completed', {
          category: response.data.category,
          sentiment: response.data.sentiment,
          priority: response.data.priority
        });
        return response.data;
      }

      throw new Error('Empty response from ML service');
    } catch (error) {
      logger.error('Error calling ML service', {
        error: error.message,
        code: error.code,
        queryId: queryData.queryId
      });

      // Return default values if ML service is unavailable
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Analyze multiple queries in batch
   * @param {Array<Object>} queries - Array of query data
   * @returns {Promise<Array<Object>>} Array of analysis results
   */
  static async analyzeBatch(queries) {
    try {
      const requests = queries.map(query => ({
        text: query.text || '',
        subject: query.subject,
        sender_email: query.senderEmail,
        sender_id: query.senderId,
        channel_type: query.channelType
      }));

      const response = await axios.post(
        `${ML_SERVICE_URL}/analyze/batch`,
        requests,
        {
          timeout: ML_SERVICE_TIMEOUT * 2, // Longer timeout for batch
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.results) {
        logger.info('ML service batch analysis completed', {
          count: response.data.count
        });
        return response.data.results;
      }

      throw new Error('Empty response from ML service');
    } catch (error) {
      logger.error('Error calling ML service for batch analysis', {
        error: error.message,
        code: error.code
      });

      // Return default values for all queries
      return queries.map(() => this.getDefaultAnalysis());
    }
  }

  /**
   * Get default analysis values (fallback when ML service is unavailable)
   * @returns {Object} Default analysis results
   */
  static getDefaultAnalysis() {
    return {
      category: 'question',
      category_confidence: 0.5,
      category_scores: {},
      sentiment: 'NEUTRAL',
      sentiment_confidence: 0.5,
      sentiment_scores: {
        positive: 0.33,
        neutral: 0.34,
        negative: 0.33
      },
      intent: 'general',
      priority: 'MEDIUM',
      priority_score: 0.5,
      is_urgent: false,
      is_vip: false,
      auto_tags: ['question', 'sentiment_neutral', 'priority_medium'],
      keywords: [],
      urgency_keywords: {}
    };
  }

  /**
   * Check if ML service is available
   * @returns {Promise<boolean>} True if service is available
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      logger.warn('ML service health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get available categories from ML service
   * @returns {Promise<Array<string>>} List of categories
   */
  static async getCategories() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/categories`, {
        timeout: 5000
      });
      return response.data.categories || [];
    } catch (error) {
      logger.warn('Error fetching categories from ML service', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get priority levels from ML service
   * @returns {Promise<Object>} Priority levels and thresholds
   */
  static async getPriorityLevels() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/priority-levels`, {
        timeout: 5000
      });
      return response.data || {};
    } catch (error) {
      logger.warn('Error fetching priority levels from ML service', {
        error: error.message
      });
      return {
        priority_levels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
        thresholds: {
          CRITICAL: 0.85,
          HIGH: 0.65,
          MEDIUM: 0.35,
          LOW: 0.0
        }
      };
    }
  }
}

module.exports = MLService;


