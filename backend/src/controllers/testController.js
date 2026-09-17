const { sequelize, TestAttempt, TestAnswer, Question, Topic, DailyQuiz, UserAnsweredQuestion } = require('../models');
const { Op } = require('sequelize');
const contentStatusService = require('../services/contentStatusService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const startTest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { dailyQuizId, testType = 'daily', topicId, difficulty, totalQuestions } = req.body;
    const parsedTotalQuestions = parseInt(totalQuestions, 10) || 50;

    const attempt = await TestAttempt.create({
      user_id: userId,
      daily_quiz_id: dailyQuizId || null,
      test_type: testType,
      topic_id: topicId || null,
      difficulty: difficulty || null,
      total_questions: parsedTotalQuestions,
      started_at: new Date(),
    });

    return successResponse(res, { attemptId: attempt.id }, 'Test attempt started', 201);
  } catch (err) {
    next(err);
  }
};

const submitTest = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;
    const { answers = [], timeTakenSeconds = 0 } = req.body;

    const attempt = await TestAttempt.findByPk(attemptId, { transaction });
    if (!attempt) {
      await transaction.rollback();
      return errorResponse(res, 'Test attempt not found', 'ATTEMPT_NOT_FOUND', 404);
    }

    if (attempt.user_id !== userId) {
      await transaction.rollback();
      return errorResponse(res, 'Unauthorized test submission', 'FORBIDDEN', 403);
    }

    if (attempt.completed_at) {
      await transaction.rollback();
      return errorResponse(res, 'Test has already been submitted', 'ALREADY_SUBMITTED', 400);
    }

    // Fetch all referenced questions to check correct answers
    const questionIds = answers.map((a) => a.questionId).filter(Boolean);
    const questions = await Question.findAll({
      where: { id: questionIds },
      attributes: ['id', 'correct_option'],
      transaction,
    });

    const questionMap = new Map(questions.map((q) => [q.id, q.correct_option]));

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const testAnswersPayload = [];

    answers.forEach((ans) => {
      const correctOpt = questionMap.get(ans.questionId);
      const selected = ans.selectedOption ? ans.selectedOption.toUpperCase() : null;

      if (!selected) {
        unansweredCount++;
        testAnswersPayload.push({
          attempt_id: attempt.id,
          question_id: ans.questionId,
          selected_option: null,
          correct_option: correctOpt || 'A',
          is_correct: false,
        });
      } else if (selected === correctOpt) {
        correctCount++;
        testAnswersPayload.push({
          attempt_id: attempt.id,
          question_id: ans.questionId,
          selected_option: selected,
          correct_option: correctOpt,
          is_correct: true,
        });
      } else {
        incorrectCount++;
        testAnswersPayload.push({
          attempt_id: attempt.id,
          question_id: ans.questionId,
          selected_option: selected,
          correct_option: correctOpt || 'A',
          is_correct: false,
        });
      }
    });

    await TestAnswer.bulkCreate(testAnswersPayload, { transaction });

    // Record user answered questions permanently with UNIQUE(user_id, question_id) constraint
    const answeredPayload = answers
      .filter((ans) => ans.questionId)
      .map((ans) => ({
        user_id: userId,
        question_id: ans.questionId,
        topic_id: attempt.topic_id || null,
        answered_at: new Date(),
      }));

    if (answeredPayload.length > 0) {
      await UserAnsweredQuestion.bulkCreate(answeredPayload, {
        ignoreDuplicates: true,
        transaction,
      });
    }

    const totalQuestions = answers.length || attempt.total_questions;
    const score = correctCount;

    await attempt.update(
      {
        score,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        unanswered: unansweredCount,
        time_taken_seconds: timeTakenSeconds,
        completed_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    return successResponse(
      res,
      {
        attemptId: attempt.id,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        unanswered: unansweredCount,
        percentage: Math.round((score / totalQuestions) * 100),
      },
      'Test submitted successfully'
    );
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit || 50, 10);
    const offset = parseInt(req.query.offset || 0, 10);

    const { rows: attempts, count } = await TestAttempt.findAndCountAll({
      where: { user_id: userId },
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
        { model: DailyQuiz, as: 'dailyQuiz', attributes: ['id', 'quiz_date'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const historyItems = attempts.map((a) => ({
      id: a.id,
      testType: a.test_type,
      quizDate: a.dailyQuiz ? a.dailyQuiz.quiz_date : null,
      topicName: a.topic ? a.topic.name : null,
      difficulty: a.difficulty,
      score: a.score || 0,
      totalQuestions: a.total_questions || 50,
      correctAnswers: a.correct_answers || 0,
      incorrectAnswers: a.incorrect_answers || 0,
      unanswered: a.unanswered || 0,
      percentage: a.total_questions ? Math.round(((a.score || 0) / a.total_questions) * 100) : 0,
      timeTakenSeconds: a.time_taken_seconds || 0,
      startedAt: a.started_at || a.created_at,
      completedAt: a.completed_at,
    }));

    return successResponse(res, {
      total: count,
      attempts: historyItems,
      history: historyItems,
    });
  } catch (err) {
    next(err);
  }
};

const getResultDetail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;

    const attempt = await TestAttempt.findByPk(attemptId, {
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
        { model: DailyQuiz, as: 'dailyQuiz', attributes: ['id', 'quiz_date'] },
        {
          model: TestAnswer,
          as: 'answers',
          include: [
            {
              model: Question,
              as: 'question',
              include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
            },
          ],
        },
      ],
    });

    if (!attempt) {
      return errorResponse(res, 'Attempt result not found', 'RESULT_NOT_FOUND', 404);
    }

    if (attempt.user_id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 'Forbidden access to result', 'FORBIDDEN', 403);
    }

    // Extract raw question objects to calculate dynamic status
    const rawQuestions = (attempt.answers || []).map((ta) => ta.question).filter(Boolean);
    const enrichedQuestionsMap = new Map();
    if (rawQuestions.length > 0) {
      const enrichedList = await contentStatusService.enrichContentList(rawQuestions, 'question', userId);
      enrichedList.forEach((eq) => enrichedQuestionsMap.set(eq.id, eq));
    }

    // Performance breakdown by difficulty and by topic
    const diffStats = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, tough: { total: 0, correct: 0 } };
    const topicStatsMap = new Map();

    const questionsReview = (attempt.answers || []).map((ta) => {
      const q = ta.question;
      const enrichedQ = q ? enrichedQuestionsMap.get(q.id) : null;
      const diff = q ? q.difficulty : 'medium';
      const topicName = q && q.topic ? q.topic.name : 'General';

      if (diffStats[diff]) {
        diffStats[diff].total++;
        if (ta.is_correct) diffStats[diff].correct++;
      }

      if (!topicStatsMap.has(topicName)) {
        topicStatsMap.set(topicName, { total: 0, correct: 0 });
      }
      const tStat = topicStatsMap.get(topicName);
      tStat.total++;
      if (ta.is_correct) tStat.correct++;

      return {
        id: q ? q.id : ta.question_id,
        question: q ? q.question : '',
        options: {
          A: q ? q.option_a : '',
          B: q ? q.option_b : '',
          C: q ? q.option_c : '',
          D: q ? q.option_d : '',
        },
        selectedOption: ta.selected_option,
        correctOption: ta.correct_option,
        isCorrect: ta.is_correct,
        explanation: q ? q.explanation : '',
        topicName,
        difficulty: diff,
        source: q ? q.source : null,
        isNew: Boolean(enrichedQ && enrichedQ.isNew),
      };
    });

    const topicPerformance = [];
    topicStatsMap.forEach((val, name) => {
      topicPerformance.push({
        topic: name,
        total: val.total,
        correct: val.correct,
        percentage: Math.round((val.correct / val.total) * 100),
      });
    });

    return successResponse(res, {
      attempt: {
        id: attempt.id,
        testType: attempt.test_type,
        quizDate: attempt.dailyQuiz ? attempt.dailyQuiz.quiz_date : null,
        score: attempt.score || 0,
        totalQuestions: attempt.total_questions || 50,
        correctAnswers: attempt.correct_answers || 0,
        incorrectAnswers: attempt.incorrect_answers || 0,
        unanswered: attempt.unanswered || 0,
        percentage: attempt.total_questions ? Math.round(((attempt.score || 0) / attempt.total_questions) * 100) : 0,
        timeTakenSeconds: attempt.time_taken_seconds || 0,
        completedAt: attempt.completed_at || attempt.created_at,
      },
      difficultyPerformance: diffStats,
      topicPerformance,
      questions: questionsReview,
    });
  } catch (err) {
    next(err);
  }
};

const getIncorrectQuestions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find all attempts for candidate user
    const userAttempts = await TestAttempt.findAll({
      where: { user_id: userId },
      attributes: ['id'],
    });

    const attemptIds = userAttempts.map((a) => a.id);

    if (attemptIds.length === 0) {
      // Fallback for candidates with no attempts yet
      const sampleQuestions = await Question.findAll({
        where: { is_active: true },
        include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
        limit: 15,
      });

      return successResponse(res, {
        total: sampleQuestions.length,
        questions: sampleQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          options: {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            D: q.option_d,
          },
          correctOption: q.correct_option,
          explanation: q.explanation,
          topicName: q.topic ? q.topic.name : 'ਪੰਜਾਬੀ ਸਾਹਿਤ',
          difficulty: q.difficulty,
          source: q.source,
        })),
      });
    }

    // Find all incorrect test answers
    const incorrectAnswers = await TestAnswer.findAll({
      where: {
        attempt_id: attemptIds,
        is_correct: false,
      },
      include: [
        {
          model: Question,
          as: 'question',
          include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
        },
      ],
      order: [['id', 'DESC']],
    });

    // Deduplicate by question ID so candidate re-attempts each unique incorrect MCQ
    const uniqueMap = new Map();
    incorrectAnswers.forEach((ta) => {
      if (ta.question && !uniqueMap.has(ta.question.id)) {
        const q = ta.question;
        uniqueMap.set(q.id, {
          id: q.id,
          question: q.question,
          options: {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            D: q.option_d,
          },
          correctOption: q.correct_option,
          explanation: q.explanation,
          topicName: q.topic ? q.topic.name : 'General',
          difficulty: q.difficulty,
          source: q.source,
          lastSelectedOption: ta.selected_option,
        });
      }
    });

    let questionsList = Array.from(uniqueMap.values());

    if (questionsList.length === 0) {
      const fallbackQs = await Question.findAll({
        where: { is_active: true },
        include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
        limit: 15,
      });
      questionsList = fallbackQs.map((q) => ({
        id: q.id,
        question: q.question,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
        correctOption: q.correct_option,
        explanation: q.explanation,
        topicName: q.topic ? q.topic.name : 'ਪੰਜਾਬੀ ਸਾਹਿਤ',
        difficulty: q.difficulty,
        source: q.source,
      }));
    }

    return successResponse(res, {
      total: questionsList.length,
      questions: questionsList,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Reset Question Bank for User (Allowed ONLY when question bank is exhausted)
 */
const resetQuestionBank = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { topicId } = req.body;

    const baseWhere = { is_active: true };
    if (topicId) baseWhere.topic_id = topicId;

    const totalPoolCount = await Question.count({ where: baseWhere });

    // Fetch answered questions for user
    const userAnswers = await UserAnsweredQuestion.findAll({
      where: { user_id: userId },
      attributes: ['question_id'],
    });
    const answeredIds = new Set(userAnswers.map((a) => a.question_id));

    // Calculate unanswered count
    const unansweredWhere = {
      ...baseWhere,
      id: { [Op.notIn]: Array.from(answeredIds).length ? Array.from(answeredIds) : [0] },
    };
    const unansweredCount = await Question.count({ where: unansweredWhere });

    // Allow reset only if unansweredCount is 0 or force Reset requested when exhausted
    if (unansweredCount > 0 && totalPoolCount > 0) {
      return errorResponse(
        res,
        `Cannot reset question bank until all questions in the topic are answered. (${unansweredCount} unanswered questions remaining)`,
        'POOL_NOT_EXHAUSTED',
        400
      );
    }

    // Delete answered question records for this user (and topic if specified)
    const deleteWhere = { user_id: userId };
    if (topicId) {
      deleteWhere.topic_id = topicId;
    }

    const deletedCount = await UserAnsweredQuestion.destroy({ where: deleteWhere });

    return successResponse(
      res,
      { resetCount: deletedCount, topicId: topicId || 'all' },
      'Question bank reset successfully. You can now practice these questions again.'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startTest,
  submitTest,
  getHistory,
  getResultDetail,
  getIncorrectQuestions,
  resetQuestionBank,
};
