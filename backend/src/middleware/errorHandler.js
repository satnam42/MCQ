const { errorResponse } = require('../utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors ? err.errors.map((e) => e.message) : [];
    return errorResponse(res, 'Database validation error', 'VALIDATION_ERROR', 400, details);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';

  return errorResponse(res, message, errorCode, statusCode);
};

module.exports = errorHandler;
