const testLimitService = require('../services/testLimitService');

/**
 * Middleware to check user test quota before proceeding.
 * @param {string} [testTypeParam] Optional explicit testType ('daily', 'practice', 'topic', 'mock').
 * If omitted, testType is extracted dynamically from req.body or req.query.
 */
const checkTestQuota = (testTypeParam) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      const userId = req.user.id;
      const testType = testTypeParam || req.body.testType || req.body.test_type || req.query.testType || 'daily';

      const quotaInfo = await testLimitService.getUserTestQuota(userId, testType);

      if (!quotaInfo.isAllowed) {
        const errorCode = testType === 'daily' ? 'DAILY_TEST_LIMIT_REACHED' : 'TEST_LIMIT_REACHED';
        return res.status(403).json({
          code: errorCode,
          message: testType === 'daily' ? 'You have reached your Daily Test limit for today.' : quotaInfo.message,
          limit: quotaInfo.limit,
          used: quotaInfo.used,
          remaining: quotaInfo.remaining,
          resetAt: quotaInfo.nextReset,
          limitInfo: quotaInfo,
        });
      }

      req.quotaInfo = quotaInfo;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  checkTestQuota,
};
