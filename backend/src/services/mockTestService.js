const {
  sequelize,
  SystemSetting,
  Topic,
  Question,
  User,
  Role,
  Permission,
  RolePermission,
  UserTestLimit,
  RoleTestLimit,
  TestAttempt,
  TestAnswer,
  UserAnsweredQuestion,
  AuditLog,
} = require('../models');
const { Op } = require('sequelize');
const testLimitService = require('./testLimitService');

/**
 * Helper to fetch system setting or fallback default value
 */
async function getSetting(key, defaultValue) {
  const setting = await SystemSetting.findByPk(key);
  if (!setting) return defaultValue;
  try {
    return JSON.parse(setting.value);
  } catch (e) {
    return setting.value;
  }
}

/**
 * Helper to set system setting
 */
async function setSetting(key, value, description = '') {
  const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
  await SystemSetting.upsert({
    key,
    value: strVal,
    description,
  });
}

/**
 * Get system-wide Mock Test configurations
 */
async function getGlobalMockSettings() {
  const enabled = await getSetting('mock_test_enabled', true);
  const allowedQuestionCounts = await getSetting('mock_test_allowed_sizes', [10, 25, 50, 100, 150]);
  const allowCustom = await getSetting('mock_test_allow_custom', true);
  const maxQuestions = await getSetting('mock_test_max_questions', 150);
  const dailyGlobalLimit = await getSetting('mock_test_daily_limit', 3);
  const weeklyGlobalLimit = await getSetting('mock_test_weekly_limit', 15);
  const monthlyGlobalLimit = await getSetting('mock_test_monthly_limit', 50);
  const selectionMode = await getSetting('mock_test_selection_mode', 'new');
  const preventDuplicates = await getSetting('mock_test_prevent_duplicates', true);
  const disabledTopicIds = await getSetting('mock_test_disabled_topics', []);
  const topicMaxMap = await getSetting('mock_test_topic_max', {});
  const difficultyDist = await getSetting('mock_test_difficulty_dist', { easy: 10, medium: 20, tough: 20 });

  return {
    enabled: Boolean(enabled),
    allowedQuestionCounts: Array.isArray(allowedQuestionCounts) ? allowedQuestionCounts : [10, 25, 50, 100, 150],
    allowCustom: Boolean(allowCustom),
    maxQuestions: parseInt(maxQuestions, 10) || 150,
    dailyGlobalLimit: dailyGlobalLimit === 'unlimited' ? 'unlimited' : parseInt(dailyGlobalLimit, 10),
    weeklyGlobalLimit: weeklyGlobalLimit === 'unlimited' ? 'unlimited' : parseInt(weeklyGlobalLimit, 10),
    monthlyGlobalLimit: monthlyGlobalLimit === 'unlimited' ? 'unlimited' : parseInt(monthlyGlobalLimit, 10),
    selectionMode,
    preventDuplicates: Boolean(preventDuplicates),
    disabledTopicIds: Array.isArray(disabledTopicIds) ? disabledTopicIds.map(Number) : [],
    topicMaxMap: typeof topicMaxMap === 'object' ? topicMaxMap : {},
    difficultyDist,
  };
}

/**
 * Verify whether a user has permission to access Mock Tests
 */
async function checkUserMockPermission(userId) {
  const user = await User.findByPk(userId);
  if (!user) return { canAccess: false, reason: 'User not found' };

  // 1. Check if global feature is disabled
  const globalEnabled = await getSetting('mock_test_enabled', true);
  if (!globalEnabled && user.role !== 'admin') {
    return { canAccess: false, reason: 'Mock Test feature is currently disabled globally.' };
  }

  // 2. Check individual user override in UserTestLimit
  const userOverride = await UserTestLimit.findOne({
    where: {
      user_id: userId,
      test_type: { [Op.in]: ['mock', 'mock_test', 'MOCK'] },
    },
  });

  if (userOverride) {
    if (userOverride.override_type === 'BLOCKED') {
      return { canAccess: false, reason: 'Mock Test is currently unavailable for your account. Please contact the administrator.' };
    }
  }

  // Admin role always has access
  if (user.role === 'admin') {
    return { canAccess: true, reason: 'Admin access' };
  }

  // 3. Check role-based permission CAN_ACCESS_MOCK_TEST
  const roleRecord = await Role.findOne({
    where: { name: user.role },
    include: [
      {
        model: Permission,
        as: 'permissions',
        where: { key: 'CAN_ACCESS_MOCK_TEST' },
        required: false,
      },
    ],
  });

  const hasRolePerm = roleRecord && roleRecord.permissions && roleRecord.permissions.length > 0;

  if (!hasRolePerm && (!userOverride || userOverride.override_type !== 'UNLIMITED')) {
    return { canAccess: false, reason: 'Mock Test is currently unavailable for your account. Please contact the administrator.' };
  }

  return { canAccess: true, reason: 'Access granted' };
}

/**
 * Get Mock Test user configuration & remaining quota info for frontend setup page
 */
async function getUserMockConfig(userId) {
  const globalSettings = await getGlobalMockSettings();
  const permCheck = await checkUserMockPermission(userId);

  // Fetch topics and available question counts
  const allTopics = await Topic.findAll({
    where: { is_active: true },
    attributes: ['id', 'name', 'description'],
    order: [['name', 'ASC']],
  });

  const topicsWithCounts = await Promise.all(
    allTopics
      .filter((t) => !globalSettings.disabledTopicIds.includes(t.id))
      .map(async (t) => {
        const questionCount = await Question.count({
          where: { topic_id: t.id, is_active: true },
        });
        const maxConfigured = globalSettings.topicMaxMap[t.id]
          ? parseInt(globalSettings.topicMaxMap[t.id], 10)
          : null;

        return {
          id: t.id,
          name: t.name,
          availableQuestions: questionCount,
          maxQuestionsAllowed: maxConfigured,
        };
      })
  );

  // Quota Information
  const quota = await testLimitService.getUserTestQuota(userId, 'mock');

  return {
    enabled: globalSettings.enabled,
    canAccess: permCheck.canAccess,
    reason: permCheck.reason,
    allowedQuestionCounts: globalSettings.allowedQuestionCounts,
    allowCustom: globalSettings.allowCustom,
    maxQuestions: globalSettings.maxQuestions,
    selectionModes: ['all', 'new', 'include_attempted'],
    defaultSelectionMode: globalSettings.selectionMode,
    preventDuplicates: globalSettings.preventDuplicates,
    topics: topicsWithCounts,
    usage: {
      status: quota.status,
      isUnlimited: quota.isUnlimited,
      dailyLimit: globalSettings.dailyGlobalLimit,
      effectiveLimit: quota.effectiveLimit,
      usedToday: quota.used,
      remainingToday: quota.remaining,
      nextReset: quota.nextReset,
    },
  };
}

/**
 * Generate & Start a Mock Test session with multi-topic question distribution
 */
async function generateMockTest({ userId, totalQuestions, topics: topicAllocations, selectionMode }) {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    // 1. Verify global enabled status & permissions
    const globalSettings = await getGlobalMockSettings();
    if (!globalSettings.enabled && user.role !== 'admin') {
      await transaction.rollback();
      const err = new Error('Mock Test feature is currently disabled globally.');
      err.status = 403;
      err.code = 'MOCK_TEST_DISABLED';
      throw err;
    }

    const permCheck = await checkUserMockPermission(userId);
    if (!permCheck.canAccess) {
      await transaction.rollback();
      const err = new Error(permCheck.reason);
      err.status = 403;
      err.code = 'MOCK_TEST_ACCESS_DENIED';
      throw err;
    }

    // 2. Validate total questions & custom size limits
    const numTotal = parseInt(totalQuestions, 10);
    if (isNaN(numTotal) || numTotal <= 0) {
      await transaction.rollback();
      const err = new Error('Invalid total questions requested.');
      err.status = 400;
      throw err;
    }

    if (numTotal > globalSettings.maxQuestions) {
      await transaction.rollback();
      const err = new Error(`Maximum ${globalSettings.maxQuestions} questions are allowed per mock test.`);
      err.status = 400;
      throw err;
    }

    const isPreset = globalSettings.allowedQuestionCounts.includes(numTotal);
    if (!isPreset && !globalSettings.allowCustom) {
      await transaction.rollback();
      const err = new Error(`Custom question sizes are currently disabled. Allowed sizes: ${globalSettings.allowedQuestionCounts.join(', ')}`);
      err.status = 400;
      throw err;
    }

    // 3. Validate Topic Allocations
    const positiveAllocations = Array.isArray(topicAllocations)
      ? topicAllocations.filter((item) => parseInt(item.questionCount, 10) > 0)
      : [];

    if (positiveAllocations.length === 0) {
      await transaction.rollback();
      const err = new Error('At least one topic must have a positive question count.');
      err.status = 400;
      throw err;
    }

    let allocatedSum = 0;
    for (const item of positiveAllocations) {
      const count = parseInt(item.questionCount, 10);
      if (isNaN(count) || count <= 0) {
        await transaction.rollback();
        const err = new Error('Question count for each topic must be a valid positive number.');
        err.status = 400;
        throw err;
      }
      allocatedSum += count;

      if (globalSettings.disabledTopicIds.includes(Number(item.topicId))) {
        await transaction.rollback();
        const err = new Error(`Topic ID ${item.topicId} is currently disabled for Mock Tests.`);
        err.status = 400;
        throw err;
      }

      // Check available questions
      const avail = await Question.count({
        where: { topic_id: item.topicId, is_active: true },
        transaction,
      });

      if (count > avail) {
        const topicObj = await Topic.findByPk(item.topicId, { transaction });
        await transaction.rollback();
        const name = topicObj ? topicObj.name : `Topic #${item.topicId}`;
        const err = new Error(`Requested ${count} questions for "${name}", but only ${avail} questions are available.`);
        err.status = 400;
        throw err;
      }

      // Check topic max limit
      const configuredMax = globalSettings.topicMaxMap[item.topicId];
      if (configuredMax && count > parseInt(configuredMax, 10)) {
        const topicObj = await Topic.findByPk(item.topicId, { transaction });
        await transaction.rollback();
        const name = topicObj ? topicObj.name : `Topic #${item.topicId}`;
        const err = new Error(`Cannot select more than ${configuredMax} questions for topic "${name}".`);
        err.status = 400;
        throw err;
      }
    }

    if (allocatedSum !== numTotal) {
      await transaction.rollback();
      const err = new Error(`Total allocated questions (${allocatedSum}) must equal requested total (${numTotal}).`);
      err.status = 400;
      throw err;
    }

    // 4. Idempotency Check & Active Session Reuse
    let activeAttempt = await TestAttempt.findOne({
      where: {
        user_id: userId,
        test_type: 'mock',
        completed_at: null,
      },
      transaction,
    });

    if (activeAttempt && activeAttempt.total_questions !== numTotal) {
      // Requested count changed - complete old active attempt so a fresh session matching new count is started
      activeAttempt.completed_at = new Date();
      await activeAttempt.save({ transaction });
      activeAttempt = null;
    }

    // 5. Quota Check (Quota deducted ONLY when new attempt is created)
    if (!activeAttempt) {
      const quotaInfo = await testLimitService.getUserTestQuota(userId, 'mock', { transaction });
      if (!quotaInfo.isAllowed) {
        await transaction.rollback();
        const err = new Error(quotaInfo.message || 'Mock Test daily/monthly usage limit reached.');
        err.status = 403;
        err.code = 'MOCK_TEST_LIMIT_REACHED';
        throw err;
      }
    }

    // 6. Select questions per topic
    const mode = selectionMode || globalSettings.selectionMode || 'new';

    // Fetch user answered questions for duplicate prevention & selection mode
    const answeredQuestionIds = new Set();
    if (userId) {
      const userAns = await UserAnsweredQuestion.findAll({
        where: { user_id: userId },
        attributes: ['question_id'],
        transaction,
      });
      userAns.forEach((a) => answeredQuestionIds.add(a.question_id));
    }

    const finalQuestions = [];

    for (const item of positiveAllocations) {
      const targetCount = parseInt(item.questionCount, 10);
      if (targetCount === 0) continue;

      const baseWhere = {
        topic_id: item.topicId,
        is_active: true,
      };

      let topicQuestions = [];

      if (mode === 'new' && answeredQuestionIds.size > 0) {
        topicQuestions = await Question.findAll({
          where: {
            ...baseWhere,
            id: { [Op.notIn]: Array.from(answeredQuestionIds) },
          },
          include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
          order: sequelize.random(),
          limit: targetCount,
          transaction,
        });

        // Fallback if not enough new questions
        if (topicQuestions.length < targetCount) {
          const fetchedIds = new Set(topicQuestions.map((q) => q.id));
          const extra = await Question.findAll({
            where: {
              ...baseWhere,
              id: { [Op.notIn]: Array.from(fetchedIds) },
            },
            include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
            order: sequelize.random(),
            limit: targetCount - topicQuestions.length,
            transaction,
          });
          topicQuestions = [...topicQuestions, ...extra];
        }
      } else {
        // 'all' or 'include_attempted' mode
        topicQuestions = await Question.findAll({
          where: baseWhere,
          include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
          order: sequelize.random(),
          limit: targetCount,
          transaction,
        });
      }

      finalQuestions.push(...topicQuestions);
    }

    // Shuffle final combined question list
    for (let i = finalQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
    }

    // 7. Create Test Attempt if not reusing active attempt
    let attempt = activeAttempt;
    if (!attempt) {
      attempt = await TestAttempt.create(
        {
          user_id: userId,
          test_type: 'mock',
          total_questions: finalQuestions.length,
          started_at: new Date(),
        },
        { transaction }
      );
    }

    await transaction.commit();
    console.log(`[Mock Test Session Ready] userId=${userId} attemptId=${attempt.id} totalQuestions=${finalQuestions.length} isExisting=${Boolean(activeAttempt)}`);

    return {
      attemptId: attempt.id,
      isExisting: Boolean(activeAttempt),
      totalQuestions: finalQuestions.length,
      questions: finalQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
        topicName: q.topic ? q.topic.name : '',
        difficulty: q.difficulty,
      })),
    };
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback().catch(() => {});
    }
    throw err;
  }
}

/**
 * Admin: Update Global Settings
 */
async function updateAdminSettings(adminUserId, newSettings, ipAddress = '') {
  const current = await getGlobalMockSettings();

  if (newSettings.enabled !== undefined) {
    await setSetting('mock_test_enabled', Boolean(newSettings.enabled), 'Global Mock Test toggle');
  }
  if (Array.isArray(newSettings.allowedQuestionCounts)) {
    await setSetting('mock_test_allowed_sizes', newSettings.allowedQuestionCounts, 'Allowed mock test sizes');
  }
  if (newSettings.allowCustom !== undefined) {
    await setSetting('mock_test_allow_custom', Boolean(newSettings.allowCustom), 'Allow custom sizes');
  }
  if (newSettings.maxQuestions !== undefined) {
    await setSetting('mock_test_max_questions', parseInt(newSettings.maxQuestions, 10), 'Max questions per mock');
  }
  if (newSettings.dailyGlobalLimit !== undefined) {
    await setSetting('mock_test_daily_limit', newSettings.dailyGlobalLimit, 'Daily global limit');
  }
  if (newSettings.weeklyGlobalLimit !== undefined) {
    await setSetting('mock_test_weekly_limit', newSettings.weeklyGlobalLimit, 'Weekly global limit');
  }
  if (newSettings.monthlyGlobalLimit !== undefined) {
    await setSetting('mock_test_monthly_limit', newSettings.monthlyGlobalLimit, 'Monthly global limit');
  }
  if (newSettings.selectionMode) {
    await setSetting('mock_test_selection_mode', newSettings.selectionMode, 'Default question selection mode');
  }
  if (newSettings.preventDuplicates !== undefined) {
    await setSetting('mock_test_prevent_duplicates', Boolean(newSettings.preventDuplicates), 'Prevent duplicates toggle');
  }
  if (Array.isArray(newSettings.disabledTopicIds)) {
    await setSetting('mock_test_disabled_topics', newSettings.disabledTopicIds.map(Number), 'Disabled topics for mock test');
  }
  if (newSettings.topicMaxMap && typeof newSettings.topicMaxMap === 'object') {
    await setSetting('mock_test_topic_max', newSettings.topicMaxMap, 'Topic level max question limits');
  }
  if (newSettings.difficultyDist && typeof newSettings.difficultyDist === 'object') {
    await setSetting('mock_test_difficulty_dist', newSettings.difficultyDist, 'Difficulty distribution preset');
  }

  const updated = await getGlobalMockSettings();

  // Audit log entry
  await AuditLog.create({
    user_id: adminUserId,
    action: 'MOCK_TEST_SETTINGS_UPDATE',
    details: `Updated Mock Test Settings. Old: ${JSON.stringify(current)} | New: ${JSON.stringify(updated)}`,
    ip_address: ipAddress,
  });

  return updated;
}

/**
 * Admin: Update individual user permission for Mock Test
 */
async function updateUserPermission(adminUserId, targetUserId, { canAccessMockTest }, ipAddress = '') {
  const user = await User.findByPk(targetUserId);
  if (!user) throw new Error('User not found');

  const overrideType = canAccessMockTest ? 'DEFAULT' : 'BLOCKED';

  let [record] = await UserTestLimit.findOrCreate({
    where: { user_id: targetUserId, test_type: 'mock' },
    defaults: {
      user_id: targetUserId,
      test_type: 'mock',
      override_type: overrideType,
      period: 'Monthly',
    },
  });

  const oldOverride = record.override_type;
  record.override_type = overrideType;
  await record.save();

  await AuditLog.create({
    user_id: adminUserId,
    action: 'USER_MOCK_PERMISSION_CHANGE',
    details: `Admin changed Mock Test access for User #${targetUserId} (${user.email}). Old: ${oldOverride} | New: ${overrideType}`,
    ip_address: ipAddress,
  });

  return {
    userId: targetUserId,
    canAccessMockTest: Boolean(canAccessMockTest),
    overrideType,
  };
}

/**
 * Admin: Update individual user mock test usage limits
 */
async function updateUserLimit(adminUserId, targetUserId, { dailyLimit, weeklyLimit, monthlyLimit }, ipAddress = '') {
  const user = await User.findByPk(targetUserId);
  if (!user) throw new Error('User not found');

  // We set custom override in UserTestLimit
  let [record] = await UserTestLimit.findOrCreate({
    where: { user_id: targetUserId, test_type: 'mock' },
    defaults: {
      user_id: targetUserId,
      test_type: 'mock',
      override_type: 'CUSTOM',
      period: 'Daily',
      custom_max_attempts: dailyLimit === 'unlimited' ? -1 : parseInt(dailyLimit, 10),
    },
  });

  const oldVal = record.custom_max_attempts;
  record.override_type = dailyLimit === 'unlimited' ? 'UNLIMITED' : 'CUSTOM';
  record.custom_max_attempts = dailyLimit === 'unlimited' ? -1 : parseInt(dailyLimit, 10);
  await record.save();

  await AuditLog.create({
    user_id: adminUserId,
    action: 'USER_MOCK_LIMIT_CHANGE',
    details: `Admin changed daily mock limit for User #${targetUserId} (${user.email}). Old: ${oldVal} | New: ${record.custom_max_attempts}`,
    ip_address: ipAddress,
  });

  const effectiveQuota = await testLimitService.getUserTestQuota(targetUserId, 'mock');

  return {
    userId: targetUserId,
    dailyLimit: record.custom_max_attempts === -1 ? 'unlimited' : record.custom_max_attempts,
    effectiveLimit: effectiveQuota.effectiveLimit,
    isUnlimited: effectiveQuota.isUnlimited,
  };
}

/**
 * Admin: Dashboard statistics for Mock Tests
 */
async function getAdminDashboardStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

  const mockTestsToday = await TestAttempt.count({
    where: {
      test_type: 'mock',
      started_at: { [Op.gte]: startOfDay },
    },
  });

  const mockTestsThisWeek = await TestAttempt.count({
    where: {
      test_type: 'mock',
      started_at: { [Op.gte]: startOfWeek },
    },
  });

  const mockAttempts = await TestAttempt.findAll({
    where: { test_type: 'mock' },
    attributes: ['total_questions', 'user_id'],
  });

  let questionsAttempted = 0;
  const activeUsersSet = new Set();
  const mockSizeCounts = {};

  mockAttempts.forEach((a) => {
    questionsAttempted += a.total_questions || 0;
    if (a.user_id) activeUsersSet.add(a.user_id);

    const sizeKey = `${a.total_questions || 50} Questions`;
    mockSizeCounts[sizeKey] = (mockSizeCounts[sizeKey] || 0) + 1;
  });

  // Count users with mock test disabled or blocked
  const disabledUsersCount = await UserTestLimit.count({
    where: { test_type: 'mock', override_type: 'BLOCKED' },
  });

  return {
    mockTestsToday,
    mockTestsThisWeek,
    questionsAttempted,
    activeMockUsers: activeUsersSet.size,
    disabledUsersCount,
    mostUsedMockSizes: mockSizeCounts,
  };
}

/**
 * Admin: Get Audit Logs
 */
async function getAuditLogs(limit = 100) {
  const logs = await AuditLog.findAll({
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    order: [['created_at', 'DESC']],
    limit,
  });

  return logs.map((l) => ({
    id: l.id,
    adminName: l.user ? l.user.name : 'System',
    adminEmail: l.user ? l.user.email : '',
    action: l.action,
    details: l.details,
    ipAddress: l.ip_address,
    createdAt: l.created_at || l.createdAt,
  }));
}

module.exports = {
  getGlobalMockSettings,
  checkUserMockPermission,
  getUserMockConfig,
  generateMockTest,
  updateAdminSettings,
  updateUserPermission,
  updateUserLimit,
  getAdminDashboardStats,
  getAuditLogs,
};
