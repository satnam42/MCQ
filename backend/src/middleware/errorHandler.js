const { errorResponse } = require('../utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || `req-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  console.error(`[Error Handler] requestId=${requestId} path=${req.path} method=${req.method} status=${err.status || err.statusCode || 500}`, {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors ? err.errors.map((e) => e.message) : [];
    return errorResponse(res, 'Database validation error', 'VALIDATION_ERROR', 400, details);
  }

  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.errorCode || err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'API_ERROR');

  // Never expose raw SQL or stack traces to end users on 500 internal errors
  const message = statusCode >= 500
    ? "We couldn't complete this request right now. Please try again."
    : (err.message || 'An error occurred');

  return res.status(statusCode).json({
    success: false,
    errorCode,
    message,
    requestId,
  });
};

module.exports = errorHandler;
