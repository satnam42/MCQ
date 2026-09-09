/**
 * Standardized API success response helper
 */
const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standardized API error response helper
 */
const errorResponse = (res, message = 'An error occurred', errorCode = 'INTERNAL_ERROR', statusCode = 500, details = null) => {
  const payload = {
    success: false,
    message,
    errorCode,
  };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};
