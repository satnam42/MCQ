const request = require('supertest');
const app = require('../server');
const errorHandler = require('../src/middleware/errorHandler');
const { sequelize, User, TestAttempt, Question, Topic, UserTestLimit } = require('../src/models');
const seedDatabase = require('../seeders');

describe('Global Error Handling & Test Submission Resilience', () => {
  let candidateToken = '';
  let candidateUser = null;
  let topic1 = null;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await seedDatabase();

    const candidateLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'candidate@punjabi.com', password: 'Candidate@12345' });
    candidateToken = candidateLoginRes.body.data.token;
    candidateUser = candidateLoginRes.body.data.user;

    const topics = await Topic.findAll();
    topic1 = topics[0];

    // Enable unlimited quota for candidate in tests
    await UserTestLimit.upsert({
      user_id: candidateUser.id,
      test_type: 'topic',
      override_type: 'UNLIMITED',
    });
  });

  describe('Authentication & Token Expiry Error Handling', () => {
    it('should reject protected endpoint when Bearer token is missing with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('should reject invalid or malformed JWT token with 401 and INVALID_TOKEN', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_TOKEN');
    });
  });

  describe('Test Session Submission Resilience & Error Handling', () => {
    it('should return 404 TEST_SESSION_NOT_FOUND when attempt ID does not exist', async () => {
      const res = await request(app)
        .post('/api/tests/999999/submit')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ answers: [], timeTakenSeconds: 30 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('TEST_SESSION_NOT_FOUND');
    });

    it('should handle test submission with missing/deleted questions gracefully without failing', async () => {
      // 1. Create a test attempt
      const attempt = await TestAttempt.create({
        user_id: candidateUser.id,
        test_type: 'topic',
        topic_id: topic1.id,
        total_questions: 2,
        started_at: new Date(),
      });

      // 2. Fetch one real question and create one fake non-existent question ID
      const realQuestion = await Question.findOne();
      expect(realQuestion).not.toBeNull();
      const fakeQuestionId = 999999;

      const res = await request(app)
        .post(`/api/tests/${attempt.id}/submit`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          answers: [
            { questionId: realQuestion.id, selectedOption: realQuestion.correct_option },
            { questionId: fakeQuestionId, selectedOption: 'A' },
          ],
          timeTakenSeconds: 45,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.missingCount).toBe(1);
      expect(res.body.data.submittedCount).toBe(1);
      expect(res.body.data.score).toBe(1);
    });

    it('should handle duplicate submission idempotently', async () => {
      const attempt = await TestAttempt.create({
        user_id: candidateUser.id,
        test_type: 'topic',
        topic_id: topic1.id,
        total_questions: 1,
        started_at: new Date(),
      });

      const question = await Question.findOne();
      expect(question).not.toBeNull();

      // First submit
      const res1 = await request(app)
        .post(`/api/tests/${attempt.id}/submit`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          answers: [{ questionId: question.id, selectedOption: question.correct_option }],
          timeTakenSeconds: 20,
        });

      expect(res1.status).toBe(200);

      // Second duplicate submit
      const res2 = await request(app)
        .post(`/api/tests/${attempt.id}/submit`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          answers: [{ questionId: question.id, selectedOption: question.correct_option }],
          timeTakenSeconds: 20,
        });

      expect(res2.status).toBe(200);
      expect(res2.body.data.isAlreadySubmitted).toBe(true);
    });
  });

  describe('Centralized Express Error Middleware Sanitization', () => {
    it('should sanitize internal errors and avoid exposing stack traces or SQL details', () => {
      const req = { path: '/api/test', method: 'GET', user: { id: 1 } };
      let jsonPayload = null;
      let statusValue = null;

      const res = {
        status: (code) => {
          statusValue = code;
          return {
            json: (data) => {
              jsonPayload = data;
              return data;
            },
          };
        },
      };

      const technicalError = new Error('SequelizeDatabaseError: SELECT * FROM secret_table WHERE error=1');
      technicalError.status = 500;

      errorHandler(technicalError, req, res, () => {});

      expect(statusValue).toBe(500);
      expect(jsonPayload.success).toBe(false);
      expect(jsonPayload.errorCode).toBe('INTERNAL_SERVER_ERROR');
      expect(jsonPayload.message).not.toContain('secret_table');
      expect(jsonPayload.requestId).toBeDefined();
    });
  });
});
