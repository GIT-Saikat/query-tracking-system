const Imap = require('imap');
const { simpleParser } = require('mailparser');
const BaseIntegration = require('./baseIntegration');
const queryService = require('../queryService');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

class EmailIntegration extends BaseIntegration {
  constructor(channelId, configuration) {
    super(channelId, configuration);
    this.imap = null;
    this.pollInterval = null;
    this.pollIntervalMs = (configuration.pollInterval || 5) * 60 * 1000;
    this.processedMessageIds = new Set();
  }

  async initialize() {
    try {
      const {
        host,
        port = 993,
        user,
        password,
        tls = true,
        mailbox = 'INBOX',
        pollInterval,
      } = this.configuration;

      if (!host || !user || !password) {
        throw new Error('Missing required email configuration: host, user, password');
      }

      if (pollInterval) {
        this.pollIntervalMs = pollInterval * 60 * 1000;
      }

      this.imap = new Imap({
        user,
        password,
        host,
        port: parseInt(port),
        tls,
        tlsOptions: { rejectUnauthorized: false },
      });

      await this.loadProcessedMessageIds();

      logger.info(`Email integration initialized for ${user}@${host}`);
      return true;
    } catch (error) {
      logger.error('Error initializing email integration:', error);
      throw error;
    }
  }

  async loadProcessedMessageIds() {
    try {
      const queries = await prisma.query.findMany({
        where: {
          channelId: this.channelId,
          externalId: { not: null },
        },
        select: { externalId: true },
      });

      this.processedMessageIds = new Set(queries.map((q) => q.externalId));
      logger.info(`Loaded ${this.processedMessageIds.size} processed message IDs`);
    } catch (error) {
      logger.error('Error loading processed message IDs:', error);
    }
  }

  async start() {
    if (this.isActive) {
      logger.warn('Email integration is already active');
      return;
    }

    try {
      await this.initialize();
      await this.connectImap();
      await this.pollEmails();

      this.pollInterval = setInterval(() => {
        this.pollEmails().catch((err) => {
          logger.error('Error in email polling:', err);
        });
      }, this.pollIntervalMs);

      this.isActive = true;
      logger.info(`Email integration started for channel ${this.channelId}`);
    } catch (error) {
      logger.error('Error starting email integration:', error);
      throw error;
    }
  }

  async connectImap() {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        logger.info('IMAP connection ready');
        resolve();
      });

      this.imap.once('error', (err) => {
        logger.error('IMAP error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  async pollEmails() {
    if (!this.imap || !this.imap.state || this.imap.state !== 'authenticated') {
      logger.warn('IMAP not connected, attempting to reconnect...');
      await this.connectImap();
    }

    return new Promise((resolve, reject) => {
      this.imap.openBox(this.configuration.mailbox || 'INBOX', false, (err, box) => {
        if (err) {
          logger.error('Error opening mailbox:', err);
          reject(err);
          return;
        }

        const since = new Date();
        since.setDate(since.getDate() - 1);

        this.imap.search(['UNSEEN', ['SINCE', since]], (err, results) => {
          if (err) {
            logger.error('Error searching emails:', err);
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            logger.debug('No new emails found');
            this.lastPollTime = new Date();
            resolve([]);
            return;
          }

          logger.info(`Found ${results.length} new email(s)`);

          const fetch = this.imap.fetch(results, {
            bodies: '',
            struct: true,
          });

          const emails = [];
          fetch.on('message', (msg, seqno) => {
            let emailData = {
              uid: results[seqno - 1],
              headers: {},
              text: '',
              html: '',
              attachments: [],
            };

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  emailData.headers = {
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '',
                    date: parsed.date,
                    messageId: parsed.messageId,
                  };
                  emailData.text = parsed.text || '';
                  emailData.html = parsed.html || '';
                  emailData.attachments = parsed.attachments || [];
                } catch (parseErr) {
                  logger.error('Error parsing email:', parseErr);
                }
              });
            });

            msg.once('end', () => {
              emails.push(emailData);
            });
          });

          fetch.once('error', (err) => {
            logger.error('Error fetching emails:', err);
            reject(err);
          });

          fetch.once('end', async () => {
            try {

              for (const email of emails) {
                await this.processEmail(email);
              }
              this.lastPollTime = new Date();
              resolve(emails);
            } catch (processErr) {
              logger.error('Error processing emails:', processErr);
              reject(processErr);
            }
          });
        });
      });
    });
  }

  async processEmail(email) {
    try {
      const messageId = email.headers.messageId || `email-${email.uid}`;

      if (this.processedMessageIds.has(messageId)) {
        logger.debug(`Email ${messageId} already processed, skipping`);
        return;
      }

      const fromMatch = email.headers.from.match(/^(.+?)\s*<(.+?)>|(.+?)$/);
      const senderName = fromMatch ? (fromMatch[1] || fromMatch[3] || '').trim() : '';
      const senderEmail = fromMatch ? (fromMatch[2] || fromMatch[3] || '').trim() : email.headers.from;

      const content = email.html || email.text || '';

      const attachments = email.attachments.map((att) => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
      }));

      const query = await queryService.createQuery({
        channelId: this.channelId,
        subject: email.headers.subject || '(No Subject)',
        content: content.substring(0, 10000),
        senderName: senderName || senderEmail,
        senderEmail: senderEmail,
        externalId: messageId,
        threadId: email.headers.messageId,
        attachments: attachments.map((a) => a.filename),
        metadata: {
          emailHeaders: email.headers,
          hasAttachments: attachments.length > 0,
          receivedAt: email.headers.date,
        },
        skipMLAnalysis: false,
      });

      this.processedMessageIds.add(messageId);

      logger.info(`Created query from email: ${query.id} - ${email.headers.subject}`);
      return query;
    } catch (error) {
      logger.error('Error processing email:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.initialize();
      await this.connectImap();
      await this.imap.end();
      return { success: true, message: 'Email connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }

    await super.stop();
  }

  async sendResponse(queryId, responseContent, attachments = []) {

    logger.warn('Email response sending not yet implemented');
    throw new Error('Email response sending not yet implemented');
  }
}

module.exports = EmailIntegration;

