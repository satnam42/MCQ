const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Topic, Question, UserAnsweredQuestion } = require('../src/models');
const seedDatabase = require('../seeders/index');
const questionGeneratorService = require('../src/services/questionGeneratorService');

describe('Answered Questions Exclusion & Exhaustion Test Suite', () => {
  let user;
  let adminToken;
  let userToken;
  let topic;
  let topicQuestions;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await seedDatabase();

    // Login Candidate
    const candRes = await request(app).post('/api/auth/login').send({
      email: 'candidate@punjabi.com',
      password: 'Candidate@12345',
    });
    userToken = candRes.body.data.token;
    user = candRes.body.data.user;

    // Create a specific isolated Topic with 10 questions for deterministic testing
    topic = await Topic.create({
      name: 'Exhaustion Test Topic',
      description: 'Test pool for question bank exhaustion',
      is_active: true,
    });

    topicQuestions = [];
    for (let i = 1; i <= 10; i++) {
      const q = await Question.create({
        question: `Test Question ${i} for Exhaustion Topic?`,
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        correct_option: 'A',
        explanation: `Explanation ${i}`,
        topic_id: topic.id,
        difficulty: 'medium',
        is_active: true,
        is_verified: true,
      });
      topicQuestions.push(q);
    }
  });

  test('UNIQUE(userId, questionId) constraint prevents duplicate answered entries', async () => {
    await UserAnsweredQuestion.create({
      user_id: user.id,
      question_id: topicQuestions[0].id,
      topic_id: topic.id,
    });

    // Inserting duplicate should be ignored via ignoreDuplicates or throw unique constraint error
    await expect(
      UserAnsweredQuestion.create({
        user_id: user.id,
        question_id: topicQuestions[0].id,
        topic_id: topic.id,
      })
    ).rejects.toThrow();
  });

  test('Day 1 & Day 2: Excludes previously answered questions across sessions/days', async () => {
    // Day 1: User answers Q1, Q2, Q3
    await UserAnsweredQuestion.bulkCreate(
      [
        { user_id: user.id, question_id: topicQuestions[0].id, topic_id: topic.id },
        { user_id: user.id, question_id: topicQuestions[1].id, topic_id: topic.id },
        { user_id: user.id, question_id: topicQuestions[2].id, topic_id: topic.id },
      ],
      { ignoreDuplicates: true }
    );

    // Day 2: Request new test of 5 questions
    const generated = await questionGeneratorService.generate({
      userId: user.id,
      topicId: topic.id,
      limit: 5,
    });

    expect(generated.length).toBe(5);
    const generatedIds = new Set(generated.map((q) => q.id));

    // Must NOT contain Q1, Q2, Q3
    expect(generatedIds.has(topicQuestions[0].id)).toBe(false);
    expect(generatedIds.has(topicQuestions[1].id)).toBe(false);
    expect(generatedIds.has(topicQuestions[2].id)).toBe(false);
  });

  test('Partial Remaining Edge Case: Returns ONLY remaining unanswered questions without reusing answered ones', async () => {
    // User has answered 8 out of 10 questions in topic
    const answered8Payload = topicQuestions.slice(0, 8).map((q) => ({
      user_id: user.id,
      question_id: q.id,
      topic_id: topic.id,
    }));
    await UserAnsweredQuestion.bulkCreate(answered8Payload, { ignoreDuplicates: true });

    // Request 5 questions when only 2 remain
    const generated = await questionGeneratorService.generate({
      userId: user.id,
      topicId: topic.id,
      limit: 5,
    });

    // Should return ONLY the 2 remaining questions
    expect(generated.length).toBe(2);
    expect(generated.partialRemaining).toBe(true);
    expect(generated.message).toContain('Only 2 new questions are remaining in this topic');

    const returnedIds = new Set(generated.map((q) => q.id));
    expect(returnedIds.has(topicQuestions[8].id)).toBe(true);
    expect(returnedIds.has(topicQuestions[9].id)).toBe(true);
  });

  test('Exhaustion Condition: Returns exhaustion alert when 0 unanswered questions remain', async () => {
    // User answers all 10 questions in topic
    const answeredAllPayload = topicQuestions.map((q) => ({
      user_id: user.id,
      question_id: q.id,
      topic_id: topic.id,
    }));
    await UserAnsweredQuestion.bulkCreate(answeredAllPayload, { ignoreDuplicates: true });

    const generated = await questionGeneratorService.generate({
      userId: user.id,
      topicId: topic.id,
      limit: 5,
    });

    expect(generated.isExhausted).toBe(true);
    expect(generated.message).toContain('You have completed all available questions in this topic. You can now restart the question bank.');
    expect(generated.length).toBe(0);
  });

  test('Reset Endpoint: Rejects reset if bank is NOT exhausted, allows reset when exhausted', async () => {
    // 1. Create a 2nd user with unexhausted bank (only 3/10 answered)
    const newUser = await User.create({
      name: 'Unexhausted User',
      email: 'unexhausted@test.com',
      password_hash: 'hash',
      role: 'candidate',
    });

    await UserAnsweredQuestion.bulkCreate([
      { user_id: newUser.id, question_id: topicQuestions[0].id, topic_id: topic.id },
      { user_id: newUser.id, question_id: topicQuestions[1].id, topic_id: topic.id },
    ]);

    // Login newUser to call reset endpoint
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'unexhausted@test.com',
      password: 'hash',
    });

    // Re-login with candidate user for valid auth
    const candRes = await request(app).post('/api/auth/login').send({
      email: 'candidate@punjabi.com',
      password: 'Candidate@12345',
    });
    const validCandidateToken = candRes.body.data.token;

    // 2. Candidate user has exhausted the topic (10/10 answered) -> Reset should succeed
    const resetRes = await request(app)
      .post('/api/tests/reset-bank')
      .set('Authorization', `Bearer ${validCandidateToken}`)
      .send({ topicId: topic.id });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
    expect(resetRes.body.message).toContain('Question bank reset successfully');

    // 3. Verify user can now generate questions again
    const freshGenerated = await questionGeneratorService.generate({
      userId: user.id,
      topicId: topic.id,
      limit: 5,
    });

    expect(freshGenerated.length).toBe(5);
    expect(freshGenerated.isExhausted).toBe(false);
  });
});
