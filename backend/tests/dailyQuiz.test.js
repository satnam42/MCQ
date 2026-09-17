const dailyQuizService = require('../src/services/dailyQuizService');
const { sequelize } = require('../src/models');
const seedDatabase = require('../seeders/index');

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await seedDatabase();
});

describe('Daily Quiz Service Unit & Integration Tests', () => {
  test('getOrGenerateDailyQuiz generates 50 questions with 20 Easy, 20 Medium, 10 Tough ratio', async () => {
    const testDate = '2026-08-21';
    const quiz = await dailyQuizService.getOrGenerateDailyQuiz(testDate);

    expect(quiz).toBeDefined();
    expect(quiz.quizDate).toBe(testDate);
    expect(quiz.totalQuestions).toBe(50);
    expect(quiz.distribution.easy).toBe(20);
    expect(quiz.distribution.medium).toBe(20);
    expect(quiz.distribution.tough).toBe(10);
    expect(quiz.questions.length).toBe(50);
  });

  test('getOrGenerateDailyQuiz returns identical persistent quiz on repeated calls for same date', async () => {
    const testDate = '2026-08-21';
    const quiz1 = await dailyQuizService.getOrGenerateDailyQuiz(testDate);
    const quiz2 = await dailyQuizService.getOrGenerateDailyQuiz(testDate);

    expect(quiz1.id).toBe(quiz2.id);
    expect(quiz1.questions.map((q) => q.id)).toEqual(quiz2.questions.map((q) => q.id));
  });

  test('getOrGenerateDailyQuiz respects limit=100 and limit=150 parameters', async () => {
    const testDate = '2026-08-21';
    const quiz100 = await dailyQuizService.getOrGenerateDailyQuiz(testDate, 100);
    expect(quiz100).toBeDefined();
    expect(quiz100.questions.length).toBeGreaterThanOrEqual(50);

    const quiz150 = await dailyQuizService.getOrGenerateDailyQuiz(testDate, 150);
    expect(quiz150).toBeDefined();
    expect(quiz150.questions.length).toBeGreaterThanOrEqual(quiz100.questions.length);
  });
});
