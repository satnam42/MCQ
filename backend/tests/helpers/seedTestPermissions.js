const { Role, Permission, RolePermission, RoleTestLimit } = require('../../src/models');

/**
 * Seeds the minimum required Role, Permission, and RolePermission data
 * for tests that use routes protected by requirePermission middleware.
 * Call this in beforeAll() after sequelize.sync({ force: true }).
 */
async function seedTestPermissions() {
  const [adminRole] = await Role.findOrCreate({
    where: { name: 'admin' },
    defaults: { name: 'admin', description: 'Administrator' },
  });

  const [candidateRole] = await Role.findOrCreate({
    where: { name: 'candidate' },
    defaults: { name: 'candidate', description: 'Candidate user' },
  });

  const permissionDefs = [
    { key: 'HOME_VIEW', label: 'Home', group: 'navigation' },
    { key: 'PRACTICE_VIEW', label: 'Practice', group: 'navigation' },
    { key: 'TOPICS_VIEW', label: 'Topics', group: 'navigation' },
    { key: 'DAILY_TEST_VIEW', label: 'Daily Test', group: 'navigation' },
    { key: 'NOTES_VIEW', label: 'Notes', group: 'navigation' },
    { key: 'MY_PROGRESS_VIEW', label: 'My Progress', group: 'navigation' },
    { key: 'SETTINGS_VIEW', label: 'Settings', group: 'navigation' },
    { key: 'TEST_HISTORY_VIEW', label: 'Test History', group: 'navigation' },
    { key: 'REATTEMPT_VIEW', label: 'Re-attempt Mistakes', group: 'navigation' },
    { key: 'MANAGE_USERS', label: 'Manage Users', group: 'admin' },
    { key: 'MANAGE_QUESTIONS', label: 'Manage Questions', group: 'admin' },
    { key: 'MANAGE_TOPICS', label: 'Manage Topics', group: 'admin' },
    { key: 'ADD_QUESTIONS', label: 'Add Questions', group: 'admin' },
    { key: 'BULK_IMPORT', label: 'Bulk Import Questions', group: 'admin' },
    { key: 'DELETE_QUESTIONS', label: 'Manage/Delete Questions', group: 'admin' },
    { key: 'ADMIN_ANALYTICS', label: 'Admin Analytics', group: 'admin' },
    { key: 'MANAGE_NOTES', label: 'Manage Notes', group: 'admin' },
    { key: 'MANAGE_PERMISSIONS', label: 'Manage Permissions', group: 'admin' },
    { key: 'MANAGE_TEST_LIMITS', label: 'Manage Test Limits', group: 'admin' },
    { key: 'MANAGE_USER_LIMITS', label: 'Manage User Test Limits', group: 'admin' },
  ];

  const createdPerms = [];
  for (const p of permissionDefs) {
    const [perm] = await Permission.findOrCreate({ where: { key: p.key }, defaults: p });
    createdPerms.push(perm);
  }

  // Admin gets ALL permissions
  for (const perm of createdPerms) {
    await RolePermission.findOrCreate({
      where: { role_id: adminRole.id, permission_id: perm.id },
    });
  }

  // Candidate gets navigation permissions only
  const navPerms = createdPerms.filter(p => p.group === 'navigation');
  for (const perm of navPerms) {
    await RolePermission.findOrCreate({
      where: { role_id: candidateRole.id, permission_id: perm.id },
    });
  }

  // Seed default RoleTestLimits
  const defaultCandidateLimits = [
    { role_id: candidateRole.id, test_type: 'daily', period: 'Daily', max_attempts: 2 },
    { role_id: candidateRole.id, test_type: 'practice', period: 'Daily', max_attempts: 10 },
    { role_id: candidateRole.id, test_type: 'topic', period: 'Daily', max_attempts: 5 },
    { role_id: candidateRole.id, test_type: 'mock', period: 'Monthly', max_attempts: 1 },
  ];
  const defaultAdminLimits = [
    { role_id: adminRole.id, test_type: 'daily', period: 'Daily', max_attempts: -1 },
    { role_id: adminRole.id, test_type: 'practice', period: 'Daily', max_attempts: -1 },
    { role_id: adminRole.id, test_type: 'topic', period: 'Daily', max_attempts: -1 },
    { role_id: adminRole.id, test_type: 'mock', period: 'Monthly', max_attempts: -1 },
  ];

  for (const rtl of [...defaultCandidateLimits, ...defaultAdminLimits]) {
    await RoleTestLimit.findOrCreate({
      where: { role_id: rtl.role_id, test_type: rtl.test_type },
      defaults: rtl,
    });
  }
}

module.exports = { seedTestPermissions };
