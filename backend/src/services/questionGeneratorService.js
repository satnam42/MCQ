const { Question, Topic, Subtopic, TestAttempt, TestAnswer, UserAnsweredQuestion, sequelize } = require('../models');
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
    repetitionMode = 'only_new',
  }) {
    const numLimit = parseInt(limit, 10) || 50;
    const baseWhere = { is_active: true };

    if (topicId) baseWhere.topic_id = topicId;
    if (difficulty && difficulty !== 'all') {
      baseWhere.difficulty = difficulty.toLowerCase();
    }

    const answeredQuestionIds = new Set();
    const incorrectAttemptedIds = new Set();

    if (userId) {
      // 1. Query permanent answered questions table
      const userAnswers = await UserAnsweredQuestion.findAll({
        where: { user_id: userId },
        attributes: ['question_id'],
      });
      userAnswers.forEach((ans) => answeredQuestionIds.add(ans.question_id));

      // 2. Query legacy test answers for backward compatibility
      const legacyAnswers = await TestAnswer.findAll({
        include: [
          {
            model: TestAttempt,
            as: 'attempt',
            where: { user_id: userId },
            attributes: [],
          },
        ],
        attributes: ['question_id', 'is_correct'],
      });
      legacyAnswers.forEach((ans) => {
        answeredQuestionIds.add(ans.question_id);
        if (ans.is_correct === false) {
          incorrectAttemptedIds.add(ans.question_id);
        }
      });
    }

    const answeredIdsArray = Array.from(answeredQuestionIds);

    // If explicit 'mix' mode requested, allow mixing previous + new questions (preferring incorrect ones)
    if (repetitionMode === 'mix' && answeredIdsArray.length > 0) {
      const targetPreviousCount = Math.floor(numLimit / 2);

      const attemptedPool = await Question.findAll({
        where: {
          ...baseWhere,
          id: { [Op.in]: answeredIdsArray },
        },
        include: [
          { model: Topic, as: 'topic', attributes: ['id', 'name'] },
          { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
        ],
      });

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

      const neededNewCount = numLimit - pickedPrevious.length;
      const newWhere = {
        ...baseWhere,
        id: { [Op.notIn]: answeredIdsArray },
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

      let selectedQuestions = [...pickedPrevious, ...pickedNew];

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

      const formatted = this.shuffleArray(selectedQuestions).map((q) => ({
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

      return formatted;
    }

    // Default / Strict 'only_new' Exclusion Logic:
    const unansweredWhere = { ...baseWhere };
    if (answeredIdsArray.length > 0) {
      unansweredWhere.id = { [Op.notIn]: answeredIdsArray };
    }

    const totalPoolCount = await Question.count({ where: baseWhere });
    const unansweredCount = await Question.count({ where: unansweredWhere });

    let selectedQuestions = [];

    // Case 1: Question Bank Exhausted (0 unanswered questions remaining)
    if (unansweredCount === 0 && totalPoolCount > 0 && userId) {
      const resultList = [];
      resultList.isExhausted = true;
      resultList.message =
        'You have completed all available questions in this topic. You can now restart the question bank.';
      resultList.totalQuestions = totalPoolCount;
      resultList.answeredQuestions = totalPoolCount;
      resultList.unansweredQuestions = 0;
      return resultList;
    }

    // Case 2: Partial Remaining Questions (e.g., requested 20, but only 5 remaining)
    if (unansweredCount < numLimit && unansweredCount > 0 && userId) {
      selectedQuestions = await Question.findAll({
        where: unansweredWhere,
        limit: unansweredCount,
        include: [
          { model: Topic, as: 'topic', attributes: ['id', 'name'] },
          { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
        ],
        order: sequelize.random(),
      });
    } else {
      // Case 3: Normal Selection (unansweredCount >= numLimit or no userId filter)
      selectedQuestions = await Question.findAll({
        where: unansweredWhere,
        limit: numLimit,
        include: [
          { model: Topic, as: 'topic', attributes: ['id', 'name'] },
          { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
        ],
        order: sequelize.random(),
      });
    }

    const formatted = selectedQuestions.map((q) => ({
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

    // Attach exhaustion & partial metadata onto array for response formatters
    if (unansweredCount < numLimit && unansweredCount > 0 && userId) {
      formatted.isExhausted = false;
      formatted.partialRemaining = true;
      formatted.message = `Only ${selectedQuestions.length} new questions are remaining in this topic.`;
      formatted.requestedLimit = numLimit;
      formatted.returnedCount = selectedQuestions.length;
      formatted.remainingCount = selectedQuestions.length;
      formatted.totalQuestions = totalPoolCount;
      formatted.answeredQuestions = totalPoolCount - selectedQuestions.length;
      formatted.unansweredQuestions = selectedQuestions.length;
    } else {
      formatted.isExhausted = false;
      formatted.partialRemaining = false;
      formatted.totalQuestions = totalPoolCount;
      formatted.answeredQuestions = totalPoolCount - unansweredCount;
      formatted.unansweredQuestions = unansweredCount;
    }

    return formatted;
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
