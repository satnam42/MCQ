const { Question, Topic, Subtopic, TestAttempt, TestAnswer, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Strategy interface for Question Generator
 */
class BaseQuestionGeneratorStrategy {
  async generateQuestions(params) {
    throw new Error('generateQuestions must be implemented by strategy');
  }
}

/**
 * Local Database Strategy (Active MVP Strategy)
 */
class LocalQuestionGeneratorStrategy extends BaseQuestionGeneratorStrategy {
  async generateQuestions({
    topicId,
    difficulty,
    limit = 50,
    language = 'Punjabi',
    userId = null,
    repetitionMode = 'mix',
  }) {
    const numLimit = parseInt(limit, 10) || 50;
    const baseWhere = { is_active: true };

    if (topicId) baseWhere.topic_id = topicId;
    if (difficulty && difficulty !== 'all') {
      baseWhere.difficulty = difficulty.toLowerCase();
    }

    let attemptedAnswers = [];
    if (userId) {
      attemptedAnswers = await TestAnswer.findAll({
        include: [
          {
            model: TestAttempt,
            as: 'attempt',
            where: { user_id: userId },
            attributes: [],
          },
        ],
        attributes: ['question_id', 'is_correct', 'created_at'],
        order: [['created_at', 'DESC']],
      });
    }

    const allAttemptedIds = new Set();
    const incorrectAttemptedIds = new Set();

    attemptedAnswers.forEach((ans) => {
      allAttemptedIds.add(ans.question_id);
      if (ans.is_correct === false) {
        incorrectAttemptedIds.add(ans.question_id);
      }
    });

    const attemptedIdsArray = Array.from(allAttemptedIds);
    let selectedQuestions = [];

    if (repetitionMode === 'only_new' && attemptedIdsArray.length > 0) {
      // Fetch ONLY questions user has never attempted before
      const newWhere = {
        ...baseWhere,
        id: { [Op.notIn]: attemptedIdsArray },
      };

      selectedQuestions = await Question.findAll({
        where: newWhere,
        limit: numLimit,
        include: [
          { model: Topic, as: 'topic', attributes: ['id', 'name'] },
          { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
        ],
        order: sequelize.random(),
      });

      // Fallback if not enough new questions exist to satisfy numLimit:
      if (selectedQuestions.length < numLimit) {
        const existingIds = new Set(selectedQuestions.map((q) => q.id));
        const additional = await Question.findAll({
          where: {
            ...baseWhere,
            id: { [Op.notIn]: Array.from(existingIds) },
          },
          limit: numLimit - selectedQuestions.length,
          include: [
            { model: Topic, as: 'topic', attributes: ['id', 'name'] },
            { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
          ],
          order: sequelize.random(),
        });
        selectedQuestions = [...selectedQuestions, ...additional];
      }
    } else if (repetitionMode === 'mix' && attemptedIdsArray.length > 0) {
      // Mix Previous + New Questions
      const targetPreviousCount = Math.floor(numLimit / 2);

      // 1. Fetch attempted questions pool matching filters
      const attemptedPool = await Question.findAll({
        where: {
          ...baseWhere,
          id: { [Op.in]: attemptedIdsArray },
        },
        include: [
          { model: Topic, as: 'topic', attributes: ['id', 'name'] },
          { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
        ],
      });

      // Split into incorrect vs correct (prefer questions answered incorrectly)
      const incorrectPool = attemptedPool.filter((q) => incorrectAttemptedIds.has(q.id));
      const correctPool = attemptedPool.filter((q) => !incorrectAttemptedIds.has(q.id));

      const shuffledIncorrect = this.shuffleArray(incorrectPool);
      const shuffledCorrect = this.shuffleArray(correctPool);

      const pickedPrevious = [];
      for (const q of shuffledIncorrect) {
        if (pickedPrevious.length < targetPreviousCount) {
          pickedPrevious.push(q);
        }
      }
      for (const q of shuffledCorrect) {
        if (pickedPrevious.length < targetPreviousCount) {
          pickedPrevious.push(q);
        }
      }

      // 2. Fetch new questions pool (not attempted)
      const neededNewCount = numLimit - pickedPrevious.length;
      const newWhere = {
        ...baseWhere,
        id: { [Op.notIn]: attemptedIdsArray },
      };

      const pickedNew = await Question.findAll({
        where: newWhere,
        limit: neededNewCount,
        include: [
          { model: Topic, as: 'topic', attributes: ['id', 'name'] },
          { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
        ],
        order: sequelize.random(),
      });

      selectedQuestions = [...pickedPrevious, ...pickedNew];

      // If still under numLimit, pick remaining from any other questions not yet included
      if (selectedQuestions.length < numLimit) {
        const currentIds = new Set(selectedQuestions.map((q) => q.id));
        const extra = await Question.findAll({
          where: {
            ...baseWhere,
            id: { [Op.notIn]: Array.from(currentIds) },
          },
          limit: numLimit - selectedQuestions.length,
          include: [
            { model: Topic, as: 'topic', attributes: ['id', 'name'] },
            { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
          ],
          order: sequelize.random(),
        });
        selectedQuestions = [...selectedQuestions, ...extra];
      }

      // Shuffle final combined list so previous and new are randomly mixed
      selectedQuestions = this.shuffleArray(selectedQuestions);
    } else {
      // Standard random generation (no attempts yet or fallback)
      selectedQuestions = await Question.findAll({
        where: baseWhere,
        limit: numLimit,
        include: [
          { model: Topic, as: 'topic', attributes: ['id', 'name'] },
          { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
        ],
        order: sequelize.random(),
      });
    }

    return selectedQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      correctOption: q.correct_option,
      explanation: q.explanation,
      topicId: q.topic_id,
      topic: q.topic ? q.topic.name : '',
      topicName: q.topic ? q.topic.name : '',
      subtopic: q.subtopic ? q.subtopic.name : '',
      subtopicName: q.subtopic ? q.subtopic.name : '',
      difficulty: q.difficulty,
      source: q.source || 'Local Database',
    }));
  }

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/**
 * OpenAI Strategy Stub (Future Expansion)
 */
class OpenAIQuestionGeneratorStrategy extends BaseQuestionGeneratorStrategy {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  async generateQuestions({ topicName, difficulty, count = 10, language = 'Punjabi' }) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in .env');
    }
    // Future OpenAI GPT-4/GPT-3.5 API call implementation
    // Prompts Punjabi Lecturer Cadre MCQs in JSON format with strict validation before publishing.
    return [
      {
        question: `[AI Generated Stub] ਪੰਜਾਬੀ ${topicName || 'ਸਾਹਿਤ'} ਨਾਲ ਸੰਬੰਧਿਤ ਪ੍ਰਸ਼ਨ`,
        optionA: 'ਉੱਤਰ ਏ',
        optionB: 'ਉੱਤਰ ਬੀ',
        optionC: 'ਉੱਤਰ ਸੀ',
        optionD: 'ਉੱਤਰ ਡੀ',
        correctOption: 'A',
        explanation: 'ਇਹ AI ਦੁਆਰਾ ਤਿਆਰ ਕੀਤਾ ਸੈਂਪਲ ਪ੍ਰਸ਼ਨ ਹੈ।',
        topic: topicName || 'Punjabi Literature',
        difficulty: difficulty || 'medium',
        source: 'OpenAI Generator (Draft)',
      },
    ];
  }
}

class QuestionGeneratorService {
  constructor() {
    this.strategies = {
      local: new LocalQuestionGeneratorStrategy(),
      openai: new OpenAIQuestionGeneratorStrategy(),
    };
    this.activeStrategy = 'local';
  }

  setStrategy(strategyName) {
    if (!this.strategies[strategyName]) {
      throw new Error(`Unknown generator strategy: ${strategyName}`);
    }
    this.activeStrategy = strategyName;
  }

  async generate(params, strategyName = null) {
    const strategy = this.strategies[strategyName || this.activeStrategy];
    return await strategy.generateQuestions(params);
  }
}

module.exports = new QuestionGeneratorService();
