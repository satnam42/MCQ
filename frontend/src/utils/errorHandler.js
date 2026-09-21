/**
 * Centralized User-Friendly Error Messages (Punjabi + English)
 */
export const ERROR_MESSAGES = {
  SESSION_EXPIRED: 'ਤੁਹਾਡਾ ਸੈਸ਼ਨ ਸਮਾਪਤ ਹੋ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਲੌਗਇਨ ਕਰੋ। (Your session has expired. Please log in again.)',
  TEST_NOT_FOUND: 'ਟੈਸਟ ਨਹੀਂ ਮਿਲਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਨਵਾਂ ਟੈਸਟ ਸ਼ੁਰੂ ਕਰੋ। (This test could not be found. Please start a new test.)',
  TEST_SESSION_NOT_FOUND: 'ਟੈਸਟ ਸੈਸ਼ਨ ਹੁਣ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਨਵਾਂ ਟੈਸਟ ਸ਼ੁਰੂ ਕਰੋ। (This test session is no longer available. Please start a new test.)',
  TEST_ALREADY_SUBMITTED: 'ਇਹ ਟੈਸਟ ਪਹਿਲਾਂ ਹੀ ਜਮ੍ਹਾਂ ਕਰਵਾਇਆ ਜਾ ਚੁੱਕਾ ਹੈ। (This test has already been submitted.)',
  NETWORK_ERROR: 'ਸਰਵਰ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਇੰਟਰਨੈਟ ਕਨੈਕਸ਼ਨ ਦੀ ਜਾਂਚ ਕਰੋ। (Unable to connect to the server. Please check your internet connection and try again.)',
  SERVER_ERROR: 'ਅਸੀਂ ਇਸ ਸਮੇਂ ਤੁਹਾਡੀ ਬੇਨਤੀ ਪੂਰੀ ਨਹੀਂ ਕਰ ਸਕੇ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ। (We couldn\'t complete your request right now. Please try again.)',
  INVALID_TEST: 'ਕੁਝ ਟੈਸਟ ਡਾਟਾ ਹੁਣ ਵੈਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਰਿਫ੍ਰੈਸ਼ ਕਰੋ। (Some test data is no longer valid. Please refresh and try again.)',
  FORBIDDEN: 'ਤੁਹਾਡੇ ਕੋਲ ਇਸ ਵਿਸ਼ੇਸ਼ਤਾ ਤੱਕ ਪਹੁੰਚ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਹੈ। (You do not have permission to access this resource.)',
  RATE_LIMIT: 'ਬਹੁਤ ਸਾਰੀਆਂ ਬੇਨਤੀਆਂ ਭੇਜੀਆਂ ਗਈਆਂ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਸਮੇਂ ਬਾਅਦ ਕੋਸ਼ਿਸ਼ ਕਰੋ। (Too many requests. Please wait a moment and try again.)',
};

/**
 * Normalizes API and Network errors into clean, user-friendly messages
 * @param {Error|Object} error - Axios error object or standard JS Error
 * @returns {{ message: string, isNetworkError: boolean, status: number|null, errorCode: string|null }}
 */
export const handleApiError = (error) => {
  if (!error) {
    return {
      message: ERROR_MESSAGES.SERVER_ERROR,
      isNetworkError: false,
      status: 500,
      errorCode: 'UNKNOWN_ERROR',
    };
  }

  // Network / Connection error or timeout
  if (!error.response) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    return {
      message: isTimeout
        ? 'ਸਰਵਰ ਪ੍ਰਤੀਕਿਰਿਆ ਦਾ ਸਮਾਂ ਸਮਾਪਤ ਹੋ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ। (Server response timed out. Please try again.)'
        : ERROR_MESSAGES.NETWORK_ERROR,
      isNetworkError: true,
      status: null,
      errorCode: isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
    };
  }

  const status = error.response.status;
  const data = error.response.data || {};
  const backendCode = data.errorCode || data.code;
  const backendMessage = data.message;

  // 1. Authentication / Session Expiry (401)
  if (status === 401) {
    return {
      message: backendMessage || ERROR_MESSAGES.SESSION_EXPIRED,
      isNetworkError: false,
      status: 401,
      errorCode: backendCode || 'UNAUTHORIZED',
    };
  }

  // 2. Permission Denied (403)
  if (status === 403) {
    return {
      message: backendMessage || ERROR_MESSAGES.FORBIDDEN,
      isNetworkError: false,
      status: 403,
      errorCode: backendCode || 'FORBIDDEN',
    };
  }

  // 3. Not Found (404)
  if (status === 404) {
    if (backendCode === 'TEST_SESSION_NOT_FOUND' || backendCode === 'ATTEMPT_NOT_FOUND') {
      return { message: ERROR_MESSAGES.TEST_SESSION_NOT_FOUND, isNetworkError: false, status: 404, errorCode: backendCode };
    }
    if (backendCode === 'TEST_NOT_FOUND') {
      return { message: ERROR_MESSAGES.TEST_NOT_FOUND, isNetworkError: false, status: 404, errorCode: backendCode };
    }
    return {
      message: backendMessage || 'ਮੰਗੀ ਗਈ ਸਮੱਗਰੀ ਨਹੀਂ ਮਿਲੀ। (Resource not found.)',
      isNetworkError: false,
      status: 404,
      errorCode: backendCode || 'NOT_FOUND',
    };
  }

  // 4. Conflict / Already Submitted (409)
  if (status === 409) {
    return {
      message: backendMessage || ERROR_MESSAGES.TEST_ALREADY_SUBMITTED,
      isNetworkError: false,
      status: 409,
      errorCode: backendCode || 'TEST_ALREADY_SUBMITTED',
    };
  }

  // 5. Rate Limit / Quota Exceeded (429)
  if (status === 429) {
    return {
      message: backendMessage || ERROR_MESSAGES.RATE_LIMIT,
      isNetworkError: false,
      status: 429,
      errorCode: backendCode || 'RATE_LIMIT',
    };
  }

  // 6. Validation Error (400 / 422)
  if (status === 400 || status === 422) {
    return {
      message: backendMessage || 'ਬੇਨਤੀ ਡਾਟਾ ਅਧੂਰਾ ਜਾਂ ਗਲਤ ਹੈ। (Invalid input data provided.)',
      isNetworkError: false,
      status,
      errorCode: backendCode || 'VALIDATION_ERROR',
    };
  }

  // 7. Server Internal Error (500+)
  return {
    message: backendMessage || ERROR_MESSAGES.SERVER_ERROR,
    isNetworkError: false,
    status: status || 500,
    errorCode: backendCode || 'INTERNAL_SERVER_ERROR',
  };
};

export default handleApiError;
