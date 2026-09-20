const { User, Role, RoleTestLimit, UserTestLimit, TestAttempt } = require('../models');
const { Op } = require('sequelize');

/**
 * Calculates period start Date and next reset ISO string in Asia/Kolkata timezone (IST)
 */
function calculatePeriodWindow(period, now = new Date()) {
  const istOffsetMs = 5.5 * 60 * 60 * 1000; // +05:30
  const istDate = new Date(now.getTime() + istOffsetMs);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const date = istDate.getUTCDate();
  const dayOfWeek = istDate.getUTCDay();

  const periodNormalized = (period || 'Daily').toLowerCase();

  if (periodNormalized === 'daily') {
    const startIstUtcMs = Date.UTC(year, month, date, 0, 0, 0);
    const periodStart = new Date(startIstUtcMs - istOffsetMs);
    const resetIstUtcMs = Date.UTC(year, month, date + 1, 0, 0, 0);
    const nextReset = new Date(resetIstUtcMs - istOffsetMs).toISOString();
    return { periodStart, nextReset };
  }

  if (periodNormalized === 'weekly') {
    // Week starts on Monday 00:00:00 IST
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const mondayDate = date - daysSinceMonday;
    const startIstUtcMs = Date.UTC(year, month, mondayDate, 0, 0, 0);
    const periodStart = new Date(startIstUtcMs - istOffsetMs);
    const resetIstUtcMs = Date.UTC(year, month, mondayDate + 7, 0, 0, 0);
    const nextReset = new Date(resetIstUtcMs - istOffsetMs).toISOString();
    return { periodStart, nextReset };
  }

  if (periodNormalized === 'monthly') {
    // Month starts on 1st of month 00:00:00 IST
    const startIstUtcMs = Date.UTC(year, month, 1, 0, 0, 0);
    const periodStart = new Date(startIstUtcMs - istOffsetMs);
    const resetIstUtcMs = Date.UTC(year, month + 1, 1, 0, 0, 0);
    const nextReset = new Date(resetIstUtcMs - istOffsetMs).toISOString();
    return { periodStart, nextReset };
  }

  if (periodNormalized === 'lifetime') {
    return { periodStart: new Date(0), nextReset: null };
  }

  // Default fallback to Daily
  const startIstUtcMs = Date.UTC(year, month, date, 0, 0, 0);
  const periodStart = new Date(startIstUtcMs - istOffsetMs);
  const resetIstUtcMs = Date.UTC(year, month, date + 1, 0, 0, 0);
  const nextReset = new Date(resetIstUtcMs - istOffsetMs).toISOString();
  return { periodStart, nextReset };
}

function toISTISOString(date) {
  if (!date) return null;
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + istOffsetMs);
  const yyyy = ist.getUTCFullYear();
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  const hh = String(ist.getUTCHours()).padStart(2, '0');
  const min = String(ist.getUTCMinutes()).padStart(2, '0');
  const ss = String(ist.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`;
}

/**
 * Single, unified backend quota resolver for a user and testType.
 * Priority: Individual User Override > Role Limit > System Default.
 * Returns explicit status ('unlimited' | 'blocked' | 'limited') and metadata.
 */
async function resolveEffectiveTestLimit(userId, testType, options = {}) {
  const transaction = options.transaction || null;
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw new Error('User not found');
  }

  const testTypeLower = String(testType || 'daily').toLowerCase();
  const testTypeVariations = (testTypeLower === 'daily' || testTypeLower === 'daily_quiz' || testTypeLower === 'daily_test')
    ? ['daily', 'daily_quiz', 'daily_test', 'Daily', 'DAILY']
    : [testType, testTypeLower, testType.toUpperCase()];

  let source = 'system_default';
  let overrideType = 'DEFAULT';
  let isBlocked = false;
  let isUnlimited = false;
  let configuredLimit = null;
  let period = 'Daily';
  let status = 'limited';
  let updatedAt = null;
  let updatedBy = null;
  let roleLimitVal = null;

  // 1. Check Individual User Override
  const userOverride = await UserTestLimit.findOne({
    where: {
      user_id: userId,
      test_type: { [Op.in]: testTypeVariations },
    },
    transaction,
  });

  if (userOverride && userOverride.override_type && userOverride.override_type.toUpperCase() !== 'DEFAULT') {
    source = 'user_override';
    overrideType = userOverride.override_type.toUpperCase();
    period = userOverride.period || 'Daily';
    updatedAt = userOverride.updated_at || userOverride.updatedAt;
    updatedBy = userOverride.updated_by || null;

    if (overrideType === 'UNLIMITED') {
      status = 'unlimited';
      isUnlimited = true;
      isBlocked = false;
      configuredLimit = null;
    } else if (overrideType === 'BLOCKED') {
      status = 'blocked';
      isUnlimited = false;
      isBlocked = true;
      configuredLimit = 0;
    } else if (overrideType === 'CUSTOM') {
      const val = userOverride.custom_max_attempts;
      if (val === -1 || val === null || val === undefined) {
        status = 'unlimited';
        isUnlimited = true;
        isBlocked = false;
        configuredLimit = null;
      } else if (val === 0) {
        status = 'blocked';
        isUnlimited = false;
        isBlocked = true;
        configuredLimit = 0;
      } else {
        status = 'limited';
        isUnlimited = false;
        isBlocked = false;
        configuredLimit = parseInt(val, 10);
      }
    }
  }

  // 2. Resolve Role Limit
  const roleWhere = [];
  if (user.role) {
    roleWhere.push(
      { name: user.role },
      { name: user.role.toLowerCase() },
      { name: user.role.toUpperCase() },
      { name: user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() }
    );
  }
  if (user.role_id) {
    roleWhere.push({ id: user.role_id });
  }

  const roleRecord = await Role.findOne({
    where: roleWhere.length ? { [Op.or]: roleWhere } : { name: 'candidate' },
    transaction,
  });

  if (roleRecord) {
    const roleLimit = await RoleTestLimit.findOne({
      where: {
        role_id: roleRecord.id,
        test_type: { [Op.in]: testTypeVariations },
      },
      transaction,
    });

    if (roleLimit) {
      roleLimitVal = roleLimit.max_attempts;
      if (source === 'system_default') {
        source = 'role';
        period = roleLimit.period || 'Daily';
        updatedAt = roleLimit.updated_at || roleLimit.updatedAt;
        updatedBy = roleLimit.updated_by || null;
        const attempts = roleLimit.max_attempts;

        if (attempts === -1) {
          status = 'unlimited';
          isUnlimited = true;
          isBlocked = false;
          configuredLimit = null;
        } else if (attempts === 0) {
          status = 'blocked';
          isUnlimited = false;
          isBlocked = true;
          configuredLimit = 0;
        } else {
          status = 'limited';
          isUnlimited = false;
          isBlocked = false;
          configuredLimit = parseInt(attempts, 10);
        }
      }
    }
  }

  // 3. Fallback to System Defaults if source is still system_default
  if (source === 'system_default') {
    if (user.role === 'admin') {
      status = 'unlimited';
      isUnlimited = true;
      isBlocked = false;
      configuredLimit = null;
      period = 'Daily';
    } else {
      const defaultTypeLimits = {
        daily: { limit: 2, period: 'Daily' },
        practice: { limit: 10, period: 'Daily' },
        topic: { limit: 5, period: 'Daily' },
        mock: { limit: 1, period: 'Monthly' },
      };
      const def = defaultTypeLimits[testTypeLower] || { limit: -1, period: 'Daily' };
      period = def.period;
      if (def.limit === -1) {
        status = 'unlimited';
        isUnlimited = true;
        isBlocked = false;
        configuredLimit = null;
      } else if (def.limit === 0) {
        status = 'blocked';
        isUnlimited = false;
        isBlocked = true;
        configuredLimit = 0;
      } else {
        status = 'limited';
        isUnlimited = false;
        isBlocked = false;
        configuredLimit = def.limit;
      }
    }
  }

  // Calculate period window (Asia/Kolkata timezone)
  const { periodStart, nextReset: rawNextReset } = calculatePeriodWindow(period);
  const resetDate = rawNextReset ? new Date(rawNextReset) : null;
  const nextReset = resetDate ? toISTISOString(resetDate) : null;

  // Query database for completed test attempts in current period
  const used = await TestAttempt.count({
    where: {
      user_id: userId,
      test_type: { [Op.in]: testTypeVariations },
      completed_at: {
        [Op.ne]: null,
        [Op.gte]: periodStart,
      },
    },
    transaction,
  });

  const isAllowed = status === 'blocked' ? false : (status === 'unlimited' ? true : used < configuredLimit);

  let remaining = null;
  if (status === 'unlimited') {
    remaining = null;
  } else if (status === 'blocked') {
    remaining = 0;
  } else {
    remaining = Math.max(0, configuredLimit - used);
  }

  let message = 'Access granted.';
  if (status === 'blocked') {
    message = `Your attempts for ${testType} test are currently blocked.`;
  } else if (!isAllowed) {
    message = testTypeLower === 'daily'
      ? `You have reached your Daily Test limit for today.`
      : `You have reached your limit of ${configuredLimit} attempts for ${period.toLowerCase()} ${testType} test.`;
  }

  const dateStr = toISTISOString(new Date()).split('T')[0];
  console.log(`[TEST QUOTA] userId=${userId} testType=${testType} userOverride=${overrideType} roleLimit=${roleLimitVal} source=${source} status=${status} effectiveLimit=${isUnlimited ? 'null' : configuredLimit} used=${used} remaining=${remaining} date=${dateStr}`);

  return {
    testType: testTypeLower,
    status, // 'unlimited' | 'blocked' | 'limited'
    source, // 'user_override' | 'role' | 'system_default'
    overrideType, // 'DEFAULT' | 'CUSTOM' | 'UNLIMITED' | 'BLOCKED'
    isUnlimited,
    isBlocked,
    isAllowed,
    configuredLimit,
    effectiveLimit: isUnlimited ? null : configuredLimit,
    limit: isUnlimited ? null : configuredLimit,
    used,
    remaining,
    period,
    nextReset,
    resetAt: nextReset,
    updatedAt: updatedAt ? toISTISOString(new Date(updatedAt)) : null,
    updatedBy,
    roleDefaultLimit: roleLimitVal,
    message,
  };
}

/**
 * Gets test quota for a user and testType (legacy alias to resolveEffectiveTestLimit).
 */
async function getUserTestQuota(userId, testType, options = {}) {
  return await resolveEffectiveTestLimit(userId, testType, options);
}

/**
 * Gets quotas for all standard test types: 'daily', 'practice', 'topic', 'mock'
 */
async function getAllUserQuotas(userId) {
  const testTypes = ['daily', 'practice', 'topic', 'mock'];
  const quotasList = await Promise.all(
    testTypes.map((type) => resolveEffectiveTestLimit(userId, type))
  );

  const quotasMap = {};
  quotasList.forEach((q) => {
    quotasMap[q.testType] = q;
  });

  return {
    ...quotasMap,
    quotas: quotasList,
  };
}

module.exports = {
  calculatePeriodWindow,
  resolveEffectiveTestLimit,
  getUserTestQuota,
  getAllUserQuotas,
};
