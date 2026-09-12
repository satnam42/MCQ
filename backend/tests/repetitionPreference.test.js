const questionGeneratorService = require('../src/services/questionGeneratorService');
const { sequelize, User, Topic, Question, TestAttempt, TestAnswer } = require('../src/models');
const seedDatabase = require('../seeders/index');

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await seedDatabase();
});

describe('Question Repetition Preference Logic Tests', () => {
  let testUser;
  let allQuestions;

  beforeAll(async () => {
    testUser = await User.findOne({ where: { role: 'candidate' } });
    allQuestions = await Question.findAll({ where: { is_active: true } });

    // Create a mock past test attempt for testUser
    const attempt = await TestAttempt.create({
      user_id: testUser.id,
      test_type: 'topic',
      total_questions: 3,
      correct_answers: 1,
      incorrect_answers: 2,
      score: 1,
    });

    // Mark Q0 as incorrect, Q1 as incorrect, Q2 as correct
    await TestAnswer.bulkCreate([
      {
        attempt_id: attempt.id,
        question_id: allQuestions[0].id,
        selected_option: 'A',
        correct_option: 'B',
        is_correct: false,
      },
      {
        attempt_id: attempt.id,
        question_id: allQuestions[1].id,
        selected_option: 'C',
        correct_option: 'D',
        is_correct: false,
      },
      {
        attempt_id: attempt.id,
        question_id: allQuestions[2].id,
        selected_option: 'A',
        correct_option: 'A',
        is_correct: true,
      },
    ]);
  });

  test('only_new mode excludes all previously attempted questions', async () => {
    const attemptedIds = new Set([allQuestions[0].id, allQuestions[1].id, allQuestions[2].id]);

    const questions = await questionGeneratorService.generate({
      userId: testUser.id,
      repetitionMode: 'only_new',
      limit: 10,
    });

    expect(questions.length).toBeGreaterThan(0);
    questions.forEach((q) => {
      expect(attemptedIds.has(q.id)).toBe(false);
    });
  });

  test('mix mode includes previously attempted questions and prioritizes incorrect ones', async () => {
    const incorrectIds = new Set([allQuestions[0].id, allQuestions[1].id]);

    const questions = await questionGeneratorService.generate({
      userId: testUser.id,
      repetitionMode: 'mix',
      limit: 10,
    });

    expect(questions.length).toBe(10);

    // Verify deduplication: no repeated question IDs in the set
    const ids = questions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Verify at least one attempted question is included in mixed mode
    const hasAttempted = ids.some((id) => id === allQuestions[0].id || id === allQuestions[1].id || id === allQuestions[2].id);
    expect(hasAttempted).toBe(true);

    // Verify priority given to incorrect questions
    const hasIncorrect = ids.some((id) => incorrectIds.has(id));
    expect(hasIncorrect).toBe(true);
  });

  test('question repetition preference works across specified difficulty levels', async () => {
    const difficulties = ['easy', 'medium', 'tough'];

    for (const diff of difficulties) {
      const questionsOnlyNew = await questionGeneratorService.generate({
        userId: testUser.id,
        repetitionMode: 'only_new',
        difficulty: diff,
        limit: 5,
      });

      expect(Array.isArray(questionsOnlyNew)).toBe(true);
      questionsOnlyNew.forEach((q) => {
        expect(q.difficulty).toBe(diff);
      });

      const questionsMix = await questionGeneratorService.generate({
        userId: testUser.id,
        repetitionMode: 'mix',
        difficulty: diff,
        limit: 5,
      });

      expect(Array.isArray(questionsMix)).toBe(true);
      questionsMix.forEach((q) => {
        expect(q.difficulty).toBe(diff);
      });
    }
  });
});
