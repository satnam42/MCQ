const request = require('supertest');
const app = require('../server');
const { sequelize, User, Role, Permission, RolePermission, Topic, Question, TestAttempt, AuditLog } = require('../src/models');
const seedDatabase = require('../seeders');

describe('Mock Test System Endpoints & Verification', () => {
  let adminToken = '';
  let candidateToken = '';
  let candidateUser = null;
  let topic1 = null;
  let topic2 = null;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await seedDatabase();

    // Login Admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@punjabi.com', password: 'Admin@12345' });
    adminToken = adminLoginRes.body.data.token;

    // Login Candidate
    const candidateLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'candidate@punjabi.com', password: 'Candidate@12345' });
    candidateToken = candidateLoginRes.body.data.token;
    candidateUser = candidateLoginRes.body.data.user;

    // Fetch topics that have questions for test execution
    const questions = await Question.findAll({ limit: 50 });
    const topicIds = Array.from(new Set(questions.map((q) => q.topic_id).filter(Boolean)));
    const topics = await Topic.findAll({ where: { id: topicIds } });
    topic1 = topics[0];
    topic2 = topics[1] || topics[0];
  });

  describe('User Mock Test Configuration & Setup', () => {
    it('should return mock test configuration for authenticated user', async () => {
      const res = await request(app)
        .get('/api/mock-tests/config')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enabled).toBe(true);
      expect(res.body.data.canAccess).toBe(true);
      expect(Array.isArray(res.body.data.allowedQuestionCounts)).toBe(true);
      expect(Array.isArray(res.body.data.topics)).toBe(true);
    });

    it('should reject generation when total allocation does not match requested questions', async () => {
      const res = await request(app)
        .post('/api/mock-tests/generate')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          totalQuestions: 10,
          selectionMode: 'new',
          topics: [
            { topicId: topic1.id, questionCount: 2 },
            { topicId: topic2.id, questionCount: 2 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Total allocated questions (4) must equal requested total (10)');
    });

    it('should generate a mock test session successfully when allocations match', async () => {
      const res = await request(app)
        .post('/api/mock-tests/generate')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          totalQuestions: 10,
          selectionMode: 'all',
          topics: [
            { topicId: topic1.id, questionCount: 5 },
            { topicId: topic2.id, questionCount: 5 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attemptId).toBeDefined();
      expect(res.body.data.totalQuestions).toBe(10);
      expect(res.body.data.questions.length).toBe(10);
    });

    it('should reuse active mock test attempt upon duplicate request (idempotency)', async () => {
      const res = await request(app)
        .post('/api/mock-tests/generate')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          totalQuestions: 10,
          selectionMode: 'all',
          topics: [
            { topicId: topic1.id, questionCount: 5 },
            { topicId: topic2.id, questionCount: 5 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isExisting).toBe(true);
    });

    it('should filter out topics with questionCount = 0 and return exact requested total', async () => {
      const { UserTestLimit } = require('../src/models');
      await UserTestLimit.upsert({
        user_id: candidateUser.id,
        test_type: 'mock',
        override_type: 'UNLIMITED',
      });

      // First complete previous active attempt so a new one is created
      await TestAttempt.update(
        { completed_at: new Date() },
        { where: { user_id: candidateUser.id, test_type: 'mock' } }
      );

      const res = await request(app)
        .post('/api/mock-tests/generate')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          totalQuestions: 5,
          selectionMode: 'all',
          topics: [
            { topicId: topic1.id, questionCount: 5 },
            { topicId: topic2.id, questionCount: 0 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalQuestions).toBe(5);
      expect(res.body.data.questions.length).toBe(5);
    });

    it('should reject generation if all topic question counts are 0', async () => {
      await TestAttempt.update(
        { completed_at: new Date() },
        { where: { user_id: candidateUser.id, test_type: 'mock' } }
      );

      const res = await request(app)
        .post('/api/mock-tests/generate')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          totalQuestions: 10,
          selectionMode: 'all',
          topics: [
            { topicId: topic1.id, questionCount: 0 },
            { topicId: topic2.id, questionCount: 0 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('At least one topic must have a positive question count');
    });
  });

  describe('Admin Mock Test Settings & Permissions', () => {
    it('should allow admin to update global settings and record audit log', async () => {
      const res = await request(app)
        .put('/api/admin/mock-tests/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          enabled: true,
          allowedQuestionCounts: [10, 25, 50, 100],
          maxQuestions: 120,
          dailyGlobalLimit: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.settings.maxQuestions).toBe(120);

      // Verify AuditLog record
      const auditLog = await AuditLog.findOne({
        where: { action: 'MOCK_TEST_SETTINGS_UPDATE' },
      });
      expect(auditLog).not.toBeNull();
    });

    it('should allow admin to update user mock test permission', async () => {
      const res = await request(app)
        .put(`/api/admin/mock-tests/users/${candidateUser.id}/mock-test-permission`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          canAccessMockTest: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block mock test generation when global feature is disabled', async () => {
      // Re-enable user permission first
      await request(app)
        .put(`/api/admin/mock-tests/users/${candidateUser.id}/mock-test-permission`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ canAccessMockTest: true });

      // Globally disable feature
      await request(app)
        .put('/api/admin/mock-tests/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ enabled: false });

      // Complete any active uncompleted attempt so a new attempt creation is tried
      await TestAttempt.update(
        { completed_at: new Date() },
        { where: { user_id: candidateUser.id, test_type: 'mock' } }
      );

      const res = await request(app)
        .post('/api/mock-tests/generate')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          totalQuestions: 10,
          topics: [{ topicId: topic1.id, questionCount: 10 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Mock Test feature is currently disabled globally');

      // Re-enable global feature for remaining tests
      await request(app)
        .put('/api/admin/mock-tests/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ enabled: true });
    });

    it('should return admin dashboard stats and audit logs', async () => {
      const statsRes = await request(app)
        .get('/api/admin/mock-tests/dashboard-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data.stats.mockTestsToday).toBeDefined();

      const logsRes = await request(app)
        .get('/api/admin/mock-tests/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(logsRes.status).toBe(200);
      expect(Array.isArray(logsRes.body.data.logs)).toBe(true);
      expect(logsRes.body.data.logs.length).toBeGreaterThan(0);
    });
  });
});
