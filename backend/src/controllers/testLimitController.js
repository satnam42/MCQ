const { RoleTestLimit, UserTestLimit, Role, User } = require('../models');
const testLimitService = require('../services/testLimitService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * GET /api/test-limits/roles OR GET /api/test-limits/roles/:roleId
 * Get role test limits for specific roleId or all roles.
 */
const getRoleLimits = async (req, res, next) => {
  try {
    const roleId = req.params.roleId || req.query.roleId;
    const where = roleId ? { role_id: roleId } : {};

    const limits = await RoleTestLimit.findAll({
      where,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }],
      order: [['role_id', 'ASC'], ['test_type', 'ASC']],
    });

    return successResponse(res, limits, 'Role test limits retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/test-limits/roles/:roleId OR PUT /api/test-limits/roles
 * Bulk update/upsert role limits.
 */
const updateRoleLimits = async (req, res, next) => {
  try {
    const routeRoleId = req.params.roleId;
    let limitsArray = [];

    if (Array.isArray(req.body.limits)) {
      limitsArray = req.body.limits;
    } else if (Array.isArray(req.body.overrides)) {
      limitsArray = req.body.overrides;
    } else if (Array.isArray(req.body.data)) {
      limitsArray = req.body.data;
    } else if (Array.isArray(req.body)) {
      limitsArray = req.body;
    } else if (typeof req.body === 'object' && req.body !== null) {
      limitsArray = [req.body];
    }

    const adminId = req.user ? req.user.id : null;
    const updatedResults = [];

    for (const item of limitsArray) {
      const roleId = item.role_id || item.roleId || routeRoleId;
      const testType = item.test_type || item.testType;
      const period = item.period || 'Daily';
      let maxAttempts = item.max_attempts !== undefined ? item.max_attempts : item.maxAttempts;

      if (maxAttempts === undefined) {
        if (item.isUnlimited || item.unlimited) maxAttempts = -1;
        else if (item.isBlocked || item.blocked) maxAttempts = 0;
        else maxAttempts = item.limit !== undefined ? item.limit : -1;
      }

      if (!roleId || !testType) {
        continue;
      }

      const testTypeLower = String(testType).toLowerCase();

      let record = await RoleTestLimit.findOne({
        where: { role_id: roleId, test_type: testTypeLower },
      });

      if (record) {
        await record.update({
          period,
          max_attempts: maxAttempts,
          updated_by: adminId,
        });
      } else {
        record = await RoleTestLimit.create({
          role_id: roleId,
          test_type: testTypeLower,
          period,
          max_attempts: maxAttempts,
          updated_by: adminId,
        });
      }
      updatedResults.push(record);
    }

    return successResponse(res, updatedResults, 'Role test limits updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/test-limits/users/:userId
 * Get user limit overrides and effective quotas by userId.
 */
const getUserLimits = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    const testTypes = ['daily', 'practice', 'topic', 'mock'];
    const effectiveQuotas = await Promise.all(
      testTypes.map((type) => testLimitService.resolveEffectiveTestLimit(userId, type))
    );

    const userOverrides = await UserTestLimit.findAll({
      where: { user_id: userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['test_type', 'ASC']],
    });

    const quotasMap = {};
    effectiveQuotas.forEach((q) => {
      quotasMap[q.testType] = q;
    });

    return successResponse(res, {
      userId: user.id,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      overrides: userOverrides,
      effectiveQuotas: quotasMap,
      quotas: effectiveQuotas,
    }, 'User test limit overrides retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/test-limits/users/:userId
 * Bulk update/upsert user limit overrides for a specific user.
 */
const updateUserLimits = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    let limitsArray = [];
    if (Array.isArray(req.body.overrides)) {
      limitsArray = req.body.overrides;
    } else if (Array.isArray(req.body.limits)) {
      limitsArray = req.body.limits;
    } else if (Array.isArray(req.body.data)) {
      limitsArray = req.body.data;
    } else if (Array.isArray(req.body)) {
      limitsArray = req.body;
    } else if (typeof req.body === 'object' && req.body !== null) {
      limitsArray = [req.body];
    }

    const adminId = req.user ? req.user.id : null;
    const updatedResults = [];

    for (const item of limitsArray) {
      const testType = item.test_type || item.testType;
      if (!testType) {
        continue;
      }
      const testTypeLower = String(testType).toLowerCase();

      let overrideType = item.override_type || item.overrideType;
      if (!overrideType) {
        if (item.isUnlimited === true || item.unlimited === true) {
          overrideType = 'UNLIMITED';
        } else if (item.isBlocked === true || item.blocked === true) {
          overrideType = 'BLOCKED';
        } else if (item.limit !== undefined && item.limit !== null && item.limit !== -1 && item.limit !== 'unlimited') {
          overrideType = 'CUSTOM';
        } else if (item.limit === -1 || item.limit === 'unlimited') {
          overrideType = 'UNLIMITED';
        } else if (item.limit === 0 || item.limit === 'blocked') {
          overrideType = 'BLOCKED';
        } else {
          overrideType = 'DEFAULT';
        }
      }

      overrideType = String(overrideType).toUpperCase();
      if (item.isUnlimited === true || item.unlimited === true) {
        overrideType = 'UNLIMITED';
      } else if (item.isBlocked === true || item.blocked === true) {
        overrideType = 'BLOCKED';
      }

      const period = item.period || 'Daily';
      let customMaxAttempts = item.custom_max_attempts !== undefined
        ? item.custom_max_attempts
        : item.customMaxAttempts;

      if (customMaxAttempts === undefined) {
        customMaxAttempts = item.limit;
      }

      if (overrideType === 'UNLIMITED') {
        customMaxAttempts = null;
      } else if (overrideType === 'BLOCKED') {
        customMaxAttempts = 0;
      } else if (overrideType === 'CUSTOM' && customMaxAttempts !== null && customMaxAttempts !== undefined) {
        customMaxAttempts = parseInt(customMaxAttempts, 10);
      }

      let record = await UserTestLimit.findOne({
        where: { user_id: userId, test_type: testTypeLower },
      });

      if (record) {
        await record.update({
          override_type: overrideType,
          period,
          custom_max_attempts: customMaxAttempts,
          updated_by: adminId,
        });
      } else {
        record = await UserTestLimit.create({
          user_id: userId,
          test_type: testTypeLower,
          override_type: overrideType,
          period,
          custom_max_attempts: customMaxAttempts,
          updated_by: adminId,
        });
      }
      updatedResults.push(record);
    }

    // Refetch fresh effective quotas after update
    const refreshedQuotas = await testLimitService.getAllUserQuotas(userId);

    return successResponse(res, {
      overrides: updatedResults,
      quotas: refreshedQuotas,
    }, 'User test limit overrides updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/test-limits/my-quotas
 * Get effective quotas for logged-in candidate for all test types.
 */
const getMyQuotas = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const quotas = await testLimitService.getAllUserQuotas(userId);
    return successResponse(res, quotas, 'User test quotas retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRoleLimits,
  updateRoleLimits,
  getUserLimits,
  updateUserLimits,
  getMyQuotas,
};
