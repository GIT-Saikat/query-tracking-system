require('dotenv').config();

module.exports = {

  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  logLevel: process.env.LOG_LEVEL || 'info',

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  socketPort: parseInt(process.env.SOCKET_PORT) || 5001,

  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8001',
  mlServiceTimeout: parseInt(process.env.ML_SERVICE_TIMEOUT) || 10000,

  slaTimes: {
    CRITICAL: 1,
    HIGH: 4,
    MEDIUM: 24,
    LOW: 72,
  },
};

