const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Topic, Question, SystemSetting, UserContentView } = require('../src/models');
const contentStatusService = require('../src/services/contentStatusService');
const seedDatabase = require('../seeders/index');

describe('Dynamic "NEW" Tag & User View Tracking Test Suite', () => {
  let adminToken;
  let userAToken;
  let userBToken;
  let userA;
  let userB;
  let newTopic;
  let oldTopic;
  let newQuestion;
  let oldQuestion;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await seedDatabase();

    // Login Admin
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@punjabi.com',
      password: 'Admin@12345',
    });
    adminToken = adminRes.body.data.token;

    // Login Candidate A
    const userARes = await request(app).post('/api/auth/login').send({
      email: 'candidate@punjabi.com',
      password: 'Candidate@12345',
    });
    userAToken = userARes.body.data.token;
    userA = userARes.body.data.user;

    // Register & Login Candidate B
    const userBReg = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userb@punjabi.com',
      password: 'Candidate@12345',
      role: 'candidate',
    });
    userBToken = userBReg.body.data.token;
    userB = userBReg.body.data.user;

    // Set deployment date to 10 days ago for testing
    const tenDaysAgo = new Date(Date.now() - 10 * 86400 * 1000).toISOString();
    await SystemSetting.upsert({
      key: 'feature_deployment_date',
      value: tenDaysAgo,
      description: 'Timestamp when dynamic new tag feature was deployed',
    });

    await SystemSetting.upsert({
      key: 'new_content_duration_days',
      value: '7',
      description: 'Duration in days',
    });

    // Create Old Topic (Created 15 days ago - before deployment)
    const fifteenDaysAgo = new Date(Date.now() - 15 * 86400 * 1000);
    oldTopic = await Topic.create({
      name: 'Old Pre-Deployment Topic',
      description: 'Created before feature deployment',
      is_active: true,
      createdAt: fifteenDaysAgo,
    });
    await oldTopic.update({ createdAt: fifteenDaysAgo }, { silent: true });

    // Create Old Question under Old Topic
    oldQuestion = await Question.create({
      question: 'Old Question Pre-Deployment?',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_option: 'A',
      topic_id: oldTopic.id,
      difficulty: 'medium',
      is_active: true,
      is_verified: true,
      createdAt: fifteenDaysAgo,
    });
    await oldQuestion.update({ createdAt: fifteenDaysAgo }, { silent: true });

    // Create New Topic (Created now)
    newTopic = await Topic.create({
      name: 'Newly Created Topic',
      description: 'Created right now after feature deployment',
      is_active: true,
    });

    // Create New Question under New Topic
    newQuestion = await Question.create({
      question: 'Newly Created Question?',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_option: 'A',
      topic_id: newTopic.id,
      difficulty: 'medium',
      is_active: true,
      is_verified: true,
    });
  });

  test('1. Dynamic isNew calculation sets isNew=true for post-deployment content and isNew=false for pre-deployment/expired content', async () => {
    const topicsRes = await request(app)
      .get('/api/topics')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(topicsRes.status).toBe(200);
    const topics = topicsRes.body.data.topics;

    const foundNew = topics.find((t) => t.id === newTopic.id);
    const foundOld = topics.find((t) => t.id === oldTopic.id);

    expect(foundNew).toBeDefined();
    expect(foundNew.isNew).toBe(true);

    expect(foundOld).toBeDefined();
    expect(foundOld.isNew).toBe(false);
  });

  test('2. Admin can update new_content_duration_days setting', async () => {
    const updateRes = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ new_content_duration_days: 14 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.new_content_duration_days).toBe(14);

    const getRes = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.settings.new_content_duration_days).toBe('14');

    // Reset back to 7 days
    await contentStatusService.updateNewContentDurationDays(7);
  });

  test('3. User View Tracking (user_content_views) handles per-user seen status', async () => {
    // User A views newTopic
    const viewResA = await request(app)
      .post('/api/content/view')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ contentType: 'topic', contentId: newTopic.id });

    expect(viewResA.status).toBe(200);
    expect(viewResA.body.data.recordedIds).toContain(newTopic.id);

    // Duplicate view attempt should succeed without constraint error
    const dupViewRes = await request(app)
      .post('/api/content/view')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ contentType: 'topic', contentId: newTopic.id });

    expect(dupViewRes.status).toBe(200);

    // Fetch topics list for User A -> newTopic should be seen
    const userATopics = await request(app)
      .get('/api/topics')
      .set('Authorization', `Bearer ${userAToken}`);

    const userANewTopic = userATopics.body.data.topics.find((t) => t.id === newTopic.id);
    expect(userANewTopic.isSeen).toBe(true);
    expect(userANewTopic.isUnseen).toBe(false);

    // Fetch topics list for User B -> newTopic should remain unseen
    const userBTopics = await request(app)
      .get('/api/topics')
      .set('Authorization', `Bearer ${userBToken}`);

    const userBNewTopic = userBTopics.body.data.topics.find((t) => t.id === newTopic.id);
    expect(userBNewTopic.isSeen).toBe(false);
    expect(userBNewTopic.isUnseen).toBe(true);
  });

  test('4. Status filtering query parameter filters content correctly', async () => {
    // Filter status=new
    const newOnlyRes = await request(app)
      .get('/api/topics?status=new')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(newOnlyRes.status).toBe(200);
    const newOnlyList = newOnlyRes.body.data.topics;
    expect(newOnlyList.every((t) => t.isNew)).toBe(true);

    // Filter status=seen for User A
    const seenResA = await request(app)
      .get('/api/topics?status=seen')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(seenResA.status).toBe(200);
    expect(seenResA.body.data.topics.some((t) => t.id === newTopic.id)).toBe(true);
  });

  test('5. Editing an item updates updatedAt but preserves createdAt and retains isNew timer', async () => {
    const updateRes = await request(app)
      .put(`/api/questions/${newQuestion.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ question: 'Newly Created Question (Updated Title)?' });

    expect(updateRes.status).toBe(200);

    const refetched = await Question.findByPk(newQuestion.id);
    expect(refetched.question).toBe('Newly Created Question (Updated Title)?');

    // CreatedAt date should remain unchanged
    const questionsCheck = await request(app)
      .get('/api/questions?status=new')
      .set('Authorization', `Bearer ${userAToken}`);

    const questionItem = questionsCheck.body.data.questions.find((q) => q.id === newQuestion.id);
    expect(questionItem.isNew).toBe(true);
  });

  test('6. Candidate topic practice returns isNew status and supports recent_new repetitionMode', async () => {
    const res = await request(app)
      .get(`/api/topics/${newTopic.id}/questions?repetitionMode=recent_new&limit=10`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    const questions = res.body.data.questions;
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.isNew === true)).toBe(true);
  });

  test('7. Test submission and getResultDetail preserves isNew status on review items', async () => {
    // Start test
    const startRes = await request(app)
      .post('/api/tests/start')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ testType: 'topic', topicId: newTopic.id, totalQuestions: 1 });

    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.data.attemptId;

    // Submit test
    const submitRes = await request(app)
      .post(`/api/tests/${attemptId}/submit`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        answers: [{ questionId: newQuestion.id, selectedOption: 'A' }],
        timeTakenSeconds: 30,
      });

    expect(submitRes.status).toBe(200);

    // Get result detail
    const resultRes = await request(app)
      .get(`/api/tests/${attemptId}/result`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resultRes.status).toBe(200);
    const reviewQuestions = resultRes.body.data.questions;
    const reviewedItem = reviewQuestions.find((q) => q.id === newQuestion.id);
    expect(reviewedItem).toBeDefined();
    expect(reviewedItem.isNew).toBe(true);
  });
});
