const logger = require('../utils/logger');
const { handleError } = require('../utils/errors');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  handleError(err, req, res, next);
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler,
};

