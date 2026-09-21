const mockTestService = require('../services/mockTestService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get Mock Test configuration & quota for user
 * GET /api/mock-tests/config
 */
const getUserConfig = async (req, res, next) => {
  try {
    const config = await mockTestService.getUserMockConfig(req.user.id);
    return successResponse(res, config, 'Mock Test configuration retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Generate / Start Mock Test with multi-topic question distribution
 * POST /api/mock-tests/generate
 */
const generateMockTest = async (req, res, next) => {
  try {
    const { totalQuestions, selectionMode, topics } = req.body;
    const result = await mockTestService.generateMockTest({
      userId: req.user.id,
      totalQuestions,
      selectionMode,
      topics,
    });
    return successResponse(res, result, result.isExisting ? 'Resuming active mock test session' : 'Mock test generated successfully', 201);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        code: err.code || 'MOCK_TEST_ERROR',
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * Admin: Get global Mock Test settings
 * GET /api/admin/mock-tests/settings
 */
const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await mockTestService.getGlobalMockSettings();
    return successResponse(res, { settings }, 'Global Mock Test settings retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Update global Mock Test settings
 * PUT /api/admin/mock-tests/settings
 */
const updateAdminSettings = async (req, res, next) => {
  try {
    const settings = await mockTestService.updateAdminSettings(req.user.id, req.body, req.ip);
    return successResponse(res, { settings }, 'Global Mock Test settings updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Update user Mock Test permission
 * PUT /api/admin/users/:userId/mock-test-permission
 */
const updateUserPermission = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { canAccessMockTest } = req.body;
    const result = await mockTestService.updateUserPermission(req.user.id, userId, { canAccessMockTest }, req.ip);
    return successResponse(res, result, `Mock Test permission updated for User #${userId}`);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Update user Mock Test usage limits
 * PUT /api/admin/users/:userId/mock-test-limit
 */
const updateUserLimit = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { dailyLimit, weeklyLimit, monthlyLimit } = req.body;
    const result = await mockTestService.updateUserLimit(req.user.id, userId, { dailyLimit, weeklyLimit, monthlyLimit }, req.ip);
    return successResponse(res, result, `Mock Test usage limits updated for User #${userId}`);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Get Mock Test dashboard statistics
 * GET /api/admin/mock-tests/dashboard-stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await mockTestService.getAdminDashboardStats();
    return successResponse(res, { stats }, 'Mock Test dashboard stats retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Get Audit Logs
 * GET /api/admin/mock-tests/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await mockTestService.getAuditLogs(100);
    return successResponse(res, { logs }, 'Audit logs retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserConfig,
  generateMockTest,
  getAdminSettings,
  updateAdminSettings,
  updateUserPermission,
  updateUserLimit,
  getDashboardStats,
  getAuditLogs,
};
