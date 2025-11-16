const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./src/config/config');
const logger = require('./src/utils/logger');
const routes = require('./src/routes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const prisma = require('./src/config/database');
const integrationManager = require('./src/services/integrationManager');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

app.use('/api', routes);

app.use(notFoundHandler);

app.use(errorHandler);

const testDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Simple health check endpoint for Render
app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

const startServer = async () => {
  try {

    await testDatabaseConnection();

    const port = config.port;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`📝 API endpoint: http://localhost:${port}/api`);
    });

    setTimeout(async () => {
      try {
        await integrationManager.startAllActiveChannels();
        logger.info('✅ All channel integrations started');
      } catch (error) {
        logger.error('⚠️ Error starting channel integrations:', error);

      }
    }, 2000);
  } catch (error) {
    logger.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  try {
    await integrationManager.stopAll();
  } catch (error) {
    logger.error('Error stopping integrations:', error);
  }

  await prisma.$disconnect();

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});

startServer();

module.exports = app;

