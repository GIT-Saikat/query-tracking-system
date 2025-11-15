require('dotenv').config();

module.exports = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Socket.io
  socketPort: parseInt(process.env.SOCKET_PORT) || 5001,
  
  // ML Service Configuration
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8001',
  mlServiceTimeout: parseInt(process.env.ML_SERVICE_TIMEOUT) || 10000,
  
  // SLA Configuration (in hours)
  slaTimes: {
    CRITICAL: 1,   // 1 hour
    HIGH: 4,       // 4 hours
    MEDIUM: 24,    // 24 hours
    LOW: 72,       // 72 hours
  },
};

