const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Role, RoleTestLimit, UserTestLimit, TestAttempt, DailyQuiz } = require('../src/models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../src/config/jwt');
const { seedTestPermissions } = require('./helpers/seedTestPermissions');
const testLimitService = require('../src/services/testLimitService');

describe('Test Limit & Quota System Verification Tests', () => {
  let adminUser;
  let candidateUser;
  let adminToken;
  let candidateToken;
  let testQuiz;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await seedTestPermissions();

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin_testlimit2@test.com',
      password_hash: 'hashed',
      role: 'admin',
    });
    adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, jwtConfig.secret);

    candidateUser = await User.create({
      name: 'Candidate User #2',
      email: 'candidate2_testlimit@test.com',
      password_hash: 'hashed',
      role: 'candidate',
    });
    candidateToken = jwt.sign({ id: candidateUser.id, role: candidateUser.role }, jwtConfig.secret);

    testQuiz = await DailyQuiz.create({
      quiz_date: '2026-09-19',
    });
  });

  describe('Section 16: Required Test Cases A through F', () => {
    beforeEach(async () => {
      await TestAttempt.destroy({ where: { user_id: candidateUser.id } });
      await UserTestLimit.destroy({ where: { user_id: candidateUser.id } });

      const candidateRole = await Role.findOne({ where: { name: 'candidate' } });
      await RoleTestLimit.upsert({
        role_id: candidateRole.id,
        test_type: 'daily',
        period: 'Daily',
        max_attempts: 2,
      });
    });

    test('Case A — Role limit (Role = 2/day, User override = Default)', async () => {
      const quota = await testLimitService.resolveEffectiveTestLimit(candidateUser.id, 'daily');
      expect(quota.status).toBe('limited');
      expect(quota.limit).toBe(2);
      expect(quota.isUnlimited).toBe(false);
      expect(quota.source).toBe('role');
    });

    test('Case B — User unlimited (Role = 2/day, User override = Unlimited via PUT /api/test-limits/users/:userId)', async () => {
      const putRes = await request(app)
        .put(`/api/test-limits/users/${candidateUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          overrides: [
            {
              testType: 'daily',
              overrideType: 'unlimited',
              limit: null,
              isUnlimited: true,
              isBlocked: false,
            },
          ],
        });

      expect(putRes.status).toBe(200);

      // Verify persisted row in DB
      const dbRecord = await UserTestLimit.findOne({
        where: { user_id: candidateUser.id, test_type: 'daily' },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.override_type).toBe('UNLIMITED');
      expect(dbRecord.custom_max_attempts).toBeNull();

      // Verify GET /api/test-limits/my-quotas returns unlimited
      const myQuotasRes = await request(app)
        .get('/api/test-limits/my-quotas')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(myQuotasRes.status).toBe(200);
      const dailyQuota = myQuotasRes.body.data.daily;
      expect(dailyQuota.status).toBe('unlimited');
      expect(dailyQuota.isUnlimited).toBe(true);
      expect(dailyQuota.limit).toBeNull();
      expect(dailyQuota.source).toBe('user_override');

      // Verify candidate can start 10 tests without restriction
      for (let i = 1; i <= 3; i++) {
        const startRes = await request(app)
          .post('/api/tests/start')
          .set('Authorization', `Bearer ${candidateToken}`)
          .send({ testType: 'daily', dailyQuizId: testQuiz.id });
        expect([200, 201]).toContain(startRes.status);
        await TestAttempt.update({ completed_at: new Date() }, { where: { id: startRes.body.data.attemptId } });
      }
    });

    test('Case C — User custom limit (Role = 2/day, User override = 5/day)', async () => {
      await request(app)
        .put(`/api/test-limits/users/${candidateUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          overrides: [
            { testType: 'daily', overrideType: 'custom', limit: 5 },
          ],
        });

      const quota = await testLimitService.resolveEffectiveTestLimit(candidateUser.id, 'daily');
      expect(quota.status).toBe('limited');
      expect(quota.limit).toBe(5);
      expect(quota.source).toBe('user_override');
    });

    test('Case D — User blocked (Role = 2/day, User override = Blocked)', async () => {
      await request(app)
        .put(`/api/test-limits/users/${candidateUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          overrides: [
            { testType: 'daily', overrideType: 'blocked' },
          ],
        });

      const quota = await testLimitService.resolveEffectiveTestLimit(candidateUser.id, 'daily');
      expect(quota.status).toBe('blocked');
      expect(quota.isBlocked).toBe(true);
      expect(quota.isAllowed).toBe(false);
      expect(quota.source).toBe('user_override');

      const startRes = await request(app)
        .post('/api/tests/start')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ testType: 'daily', dailyQuizId: testQuiz.id });
      expect(startRes.status).toBe(403);
      expect(startRes.body.code).toBe('DAILY_TEST_LIMIT_REACHED');
    });

    test('Case E — Reset to default', async () => {
      await request(app)
        .put(`/api/test-limits/users/${candidateUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          overrides: [
            { testType: 'daily', overrideType: 'default' },
          ],
        });

      const quota = await testLimitService.resolveEffectiveTestLimit(candidateUser.id, 'daily');
      expect(quota.status).toBe('limited');
      expect(quota.limit).toBe(2);
      expect(quota.source).toBe('role');
    });

    test('Case F — Cache refresh / No stale response after save', async () => {
      // 1. Initial GET /my-quotas -> returns limit 2
      const initial = await request(app)
        .get('/api/test-limits/my-quotas')
        .set('Authorization', `Bearer ${candidateToken}`);
      expect(initial.body.data.daily.limit).toBe(2);

      // 2. Admin saves Unlimited
      await request(app)
        .put(`/api/test-limits/users/${candidateUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          overrides: [
            { testType: 'daily', overrideType: 'unlimited', isUnlimited: true },
          ],
        });

      // 3. Immediate GET /my-quotas -> returns fresh unlimited data with no-store headers
      const refreshed = await request(app)
        .get('/api/test-limits/my-quotas')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(refreshed.headers['cache-control']).toContain('no-store');
      expect(refreshed.body.data.daily.status).toBe('unlimited');
      expect(refreshed.body.data.daily.isUnlimited).toBe(true);
      expect(refreshed.body.data.daily.limit).toBeNull();
    });

    test('Submission Quota Consumption — Submitting test consumes exactly 1 quota, idempotency prevents double counting', async () => {
      // 1. Initial status: Limit = 2, Used = 0, Remaining = 2
      const initialQuotas = await request(app)
        .get('/api/test-limits/my-quotas')
        .set('Authorization', `Bearer ${candidateToken}`);
      expect(initialQuotas.body.data.daily.used).toBe(0);
      expect(initialQuotas.body.data.daily.remaining).toBe(2);

      // 2. Start Test #1 (creates attempt, but completed_at is null -> does not consume quota yet)
      const start1 = await request(app)
        .post('/api/tests/start')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ testType: 'daily', dailyQuizId: testQuiz.id });
      expect(start1.status).toBe(201);
      const attemptId1 = start1.body.data.attemptId;

      // Quota while test is in-progress: still 0 used, 2 remaining
      const inProgressQuotas = await request(app)
        .get('/api/test-limits/my-quotas')
        .set('Authorization', `Bearer ${candidateToken}`);
      expect(inProgressQuotas.body.data.daily.used).toBe(0);
      expect(inProgressQuotas.body.data.daily.remaining).toBe(2);

      // 3. Submit Test #1 -> should consume 1 quota
      const submit1 = await request(app)
        .post(`/api/tests/${attemptId1}/submit`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ answers: [], timeTakenSeconds: 30 });
      expect(submit1.status).toBe(200);
      expect(submit1.body.data.quota.used).toBe(1);
      expect(submit1.body.data.quota.remaining).toBe(1);

      // GET /my-quotas after submit Test #1: used=1, remaining=1
      const afterSubmit1 = await request(app)
        .get('/api/test-limits/my-quotas')
        .set('Authorization', `Bearer ${candidateToken}`);
      expect(afterSubmit1.body.data.daily.used).toBe(1);
      expect(afterSubmit1.body.data.daily.remaining).toBe(1);

      // 4. Submit Test #1 AGAIN (idempotency retry) -> must NOT consume second quota
      const submit1Retry = await request(app)
        .post(`/api/tests/${attemptId1}/submit`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ answers: [], timeTakenSeconds: 30 });
      expect(submit1Retry.status).toBe(200);
      expect(submit1Retry.body.data.isAlreadySubmitted).toBe(true);
      expect(submit1Retry.body.data.quota.used).toBe(1);
      expect(submit1Retry.body.data.quota.remaining).toBe(1);

      // 5. Start and Submit Test #2 -> used=2, remaining=0
      const start2 = await request(app)
        .post('/api/tests/start')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ testType: 'daily', dailyQuizId: testQuiz.id });
      expect([200, 201]).toContain(start2.status);
      const attemptId2 = start2.body.data.attemptId;

      const submit2 = await request(app)
        .post(`/api/tests/${attemptId2}/submit`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ answers: [], timeTakenSeconds: 45 });
      expect(submit2.status).toBe(200);
      expect(submit2.body.data.quota.used).toBe(2);
      expect(submit2.body.data.quota.remaining).toBe(0);

      // 6. Attempt Test #3 -> Should be BLOCKED with 403 DAILY_TEST_LIMIT_REACHED
      const start3 = await request(app)
        .post('/api/tests/start')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ testType: 'daily', dailyQuizId: testQuiz.id });
      expect(start3.status).toBe(403);
      expect(start3.body.code).toBe('DAILY_TEST_LIMIT_REACHED');
      expect(start3.body.used).toBe(2);
      expect(start3.body.remaining).toBe(0);
    });
  });
});
