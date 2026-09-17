const { sequelize, DailyQuiz, DailyQuizQuestion, Question, Topic, Subtopic, UserAnsweredQuestion } = require('../models');
const { Op } = require('sequelize');
const contentStatusService = require('./contentStatusService');

class DailyQuizService {
  /**
   * Retrieves existing Daily Quiz for given date (YYYY-MM-DD) or generates a new persistent one.
   * If userId is passed, excludes questions previously answered by userId across all days.
   */
  async getOrGenerateDailyQuiz(dateString, limit = 50, userId = null) {
    const targetDate = dateString || new Date().toISOString().split('T')[0];
    const reqLimit = parseInt(limit, 10) || 50;

    // 1. Check if daily quiz exists for date
    let quiz = await DailyQuiz.findOne({
      where: { quiz_date: targetDate },
      include: [
        {
          model: DailyQuizQuestion,
          as: 'quizQuestions',
          include: [
            {
              model: Question,
              as: 'question',
              include: [
                { model: Topic, as: 'topic', attributes: ['id', 'name'] },
                { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
              ],
            },
          ],
        },
      ],
      order: [[{ model: DailyQuizQuestion, as: 'quizQuestions' }, 'question_order', 'ASC']],
    });

    if (!quiz) {
      quiz = await this.generateDailyQuiz(targetDate);
    }

    let formatted = this.formatQuizResponse(quiz);

    // If userId provided, filter out questions answered by this user across all days
    let activeQuestions = formatted.questions;
    let answeredIds = new Set();
    if (userId) {
      const userAnswers = await UserAnsweredQuestion.findAll({
        where: { user_id: userId },
        attributes: ['question_id'],
      });
      answeredIds = new Set(userAnswers.map((a) => a.question_id));
      if (answeredIds.size > 0) {
        activeQuestions = activeQuestions.filter((q) => !answeredIds.has(q.id));
      }
    }

    // If activeQuestions count is less than reqLimit (e.g. daily quiz has 50 questions, but candidate requested 100 or 150),
    // fetch additional active questions to meet reqLimit
    if (activeQuestions.length < reqLimit) {
      const existingIds = new Set(activeQuestions.map((q) => q.id));
      const excludedIds = Array.from(new Set([...Array.from(answeredIds), ...Array.from(existingIds)]));

      let extraQuestions = await Question.findAll({
        where: {
          is_active: true,
          id: { [Op.notIn]: excludedIds.length ? excludedIds : [0] },
        },
        include: [
          { model: Topic, as: 'topic', attributes: ['id', 'name'] },
          { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
        ],
        limit: reqLimit - activeQuestions.length,
        order: sequelize.random(),
      });

      // If excluding answered questions leaves us short of reqLimit, fallback to fetching active questions regardless of answered status
      if (activeQuestions.length + extraQuestions.length < reqLimit) {
        const currentIds = Array.from(new Set([...Array.from(existingIds), ...extraQuestions.map((q) => q.id)]));
        const fallbackExtra = await Question.findAll({
          where: {
            is_active: true,
            id: { [Op.notIn]: currentIds.length ? currentIds : [0] },
          },
          include: [
            { model: Topic, as: 'topic', attributes: ['id', 'name'] },
            { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
          ],
          limit: reqLimit - (activeQuestions.length + extraQuestions.length),
          order: sequelize.random(),
        });
        extraQuestions = [...extraQuestions, ...fallbackExtra];
      }

      const formattedExtra = extraQuestions.map((q, index) => ({
        order: activeQuestions.length + index + 1,
        id: q.id,
        question: q.question,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
        topicId: q.topic_id,
        topicName: q.topic ? q.topic.name : '',
        subtopicName: q.subtopic ? q.subtopic.name : '',
        difficulty: q.difficulty,
        source: q.source,
        createdAt: q.created_at || q.createdAt,
        created_at: q.created_at || q.createdAt,
      }));

      activeQuestions = [...activeQuestions, ...formattedExtra];
    }

    if (activeQuestions.length >= reqLimit) {
      activeQuestions = activeQuestions.slice(0, reqLimit);
    }

    const enriched = await contentStatusService.enrichContentList(activeQuestions, 'question', userId);
    formatted.questions = enriched.map((q, idx) => ({
      ...q,
      order: idx + 1,
      isNew: Boolean(q.isNew),
    }));
    formatted.totalQuestions = formatted.questions.length;
    if (formatted.totalQuestions < reqLimit) {
      formatted.message = `Only ${formatted.totalQuestions} questions are currently available.`;
    }
    return formatted;
  }

  /**
   * Generates and persists a new daily quiz for targetDate
   */
  async generateDailyQuiz(targetDate) {
    const totalReq = parseInt(process.env.DAILY_TOTAL_QUESTIONS || 50, 10);
    const easyReq = parseInt(process.env.DAILY_EASY_COUNT || 20, 10);
    const mediumReq = parseInt(process.env.DAILY_MEDIUM_COUNT || 20, 10);
    const toughReq = parseInt(process.env.DAILY_TOUGH_COUNT || 10, 10);
    const exclusionDays = parseInt(process.env.RECENT_QUIZ_EXCLUSION_DAYS || 7, 10);

    // Calculate cutoff date for recently used questions
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - exclusionDays);

    const recentQuizzes = await DailyQuiz.findAll({
      where: {
        created_at: {
          [Op.gte]: cutoffDate,
        },
      },
      include: [{ model: DailyQuizQuestion, as: 'quizQuestions', attributes: ['question_id'] }],
    });

    const recentQuestionIds = new Set();
    recentQuizzes.forEach((rq) => {
      if (rq.quizQuestions) {
        rq.quizQuestions.forEach((dqq) => recentQuestionIds.add(dqq.question_id));
      }
    });

    const excludedIdsArray = Array.from(recentQuestionIds);

    // Helper to fetch pool by difficulty
    const fetchQuestionPool = async (difficulty, requiredCount) => {
      const baseWhere = {
        difficulty,
        is_active: true,
      };

      let pool = await Question.findAll({
        where: {
          ...baseWhere,
          id: { [Op.notIn]: excludedIdsArray.length ? excludedIdsArray : [0] },
        },
      });

      // If excluded filter left us short, fallback to all active questions of that difficulty
      if (pool.length < requiredCount) {
        pool = await Question.findAll({
          where: baseWhere,
        });
      }

      // Shuffle pool
      return this.shuffleArray(pool).slice(0, requiredCount);
    };

    const easyQuestions = await fetchQuestionPool('easy', easyReq);
    const mediumQuestions = await fetchQuestionPool('medium', mediumReq);
    const toughQuestions = await fetchQuestionPool('tough', toughReq);

    let combined = [...easyQuestions, ...mediumQuestions, ...toughQuestions];
    combined = this.shuffleArray(combined);

    // Save in Transaction
    const transaction = await sequelize.transaction();
    try {
      const newQuiz = await DailyQuiz.create(
        {
          quiz_date: targetDate,
          total_questions: combined.length,
          easy_count: easyQuestions.length,
          medium_count: mediumQuestions.length,
          tough_count: toughQuestions.length,
        },
        { transaction }
      );

      const quizQuestionsPayload = combined.map((q, index) => ({
        daily_quiz_id: newQuiz.id,
        question_id: q.id,
        question_order: index + 1,
      }));

      await DailyQuizQuestion.bulkCreate(quizQuestionsPayload, { transaction });

      await transaction.commit();

      // Refetch with relations
      return await DailyQuiz.findByPk(newQuiz.id, {
        include: [
          {
            model: DailyQuizQuestion,
            as: 'quizQuestions',
            include: [
              {
                model: Question,
                as: 'question',
                include: [
                  { model: Topic, as: 'topic', attributes: ['id', 'name'] },
                  { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
                ],
              },
            ],
          },
        ],
        order: [[{ model: DailyQuizQuestion, as: 'quizQuestions' }, 'question_order', 'ASC']],
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  formatQuizResponse(quiz) {
    const formattedQuestions = (quiz.quizQuestions || []).map((qq, index) => {
      const q = qq.question;
      return {
        order: qq.question_order || index + 1,
        id: q.id,
        question: q.question,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
        topicId: q.topic_id,
        topicName: q.topic ? q.topic.name : '',
        subtopicName: q.subtopic ? q.subtopic.name : '',
        difficulty: q.difficulty,
        source: q.source,
        sourceUrl: q.source_url,
        createdAt: q ? (q.created_at || q.createdAt) : null,
        created_at: q ? (q.created_at || q.createdAt) : null,
      };
    });

    return {
      id: quiz.id,
      quizDate: quiz.quiz_date,
      totalQuestions: quiz.total_questions,
      distribution: {
        easy: quiz.easy_count,
        medium: quiz.medium_count,
        tough: quiz.tough_count,
      },
      questions: formattedQuestions,
    };
  }
}

module.exports = new DailyQuizService();
