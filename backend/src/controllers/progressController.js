const { TestAttempt, TestAnswer, Question, Topic, sequelize } = require('../models');
const { successResponse } = require('../utils/responseFormatter');

const getProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user's completed test attempts
    const attempts = await TestAttempt.findAll({
      where: { user_id: userId },
      include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
      order: [['completed_at', 'ASC']],
    });

    if (!attempts || attempts.length === 0) {
      return successResponse(res, {
        testsAttempted: 0,
        averageScore: 0,
        bestScore: 0,
        questionsAttempted: 0,
        accuracy: 0,
        scoreHistory: [],
        topicAccuracy: [],
        difficultyAccuracy: { easy: 0, medium: 0, tough: 0 },
        weakTopics: [],
      });
    }

    const testsAttempted = attempts.length;
    let totalQuestionsAttempted = 0;
    let totalCorrectAnswers = 0;
    let bestScore = 0;

    const scoreHistory = attempts.map((a) => {
      totalQuestionsAttempted += a.total_questions;
      totalCorrectAnswers += a.correct_answers;
      const pct = Math.round((a.score / a.total_questions) * 100);
      if (pct > bestScore) bestScore = pct;

      return {
        attemptId: a.id,
        date: a.completed_at || a.started_at,
        score: a.score,
        totalQuestions: a.total_questions,
        percentage: pct,
        testType: a.test_type,
      };
    });

    const averageScore = Math.round(
      scoreHistory.reduce((acc, curr) => acc + curr.percentage, 0) / testsAttempted
    );

    const overallAccuracy = totalQuestionsAttempted > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100)
      : 0;

    // Fetch all detailed answers by user for topic & difficulty breakdown
    const attemptIds = attempts.map((a) => a.id);
    const answers = await TestAnswer.findAll({
      where: { attempt_id: attemptIds },
      include: [
        {
          model: Question,
          as: 'question',
          include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
        },
      ],
    });

    const topicStatsMap = new Map();
    const diffStats = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      tough: { total: 0, correct: 0 },
    };

    answers.forEach((ans) => {
      const q = ans.question;
      if (!q) return;

      const diff = q.difficulty || 'medium';
      if (diffStats[diff]) {
        diffStats[diff].total++;
        if (ans.is_correct) diffStats[diff].correct++;
      }

      const topicId = q.topic_id;
      const topicName = q.topic ? q.topic.name : 'General';

      if (!topicStatsMap.has(topicId)) {
        topicStatsMap.set(topicId, { id: topicId, name: topicName, total: 0, correct: 0 });
      }
      const tStat = topicStatsMap.get(topicId);
      tStat.total++;
      if (ans.is_correct) tStat.correct++;
    });

    const topicAccuracy = [];
    const weakTopics = [];

    topicStatsMap.forEach((stat) => {
      const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      const item = {
        id: stat.id,
        topic: stat.name,
        totalQuestions: stat.total,
        correct: stat.correct,
        accuracy: pct,
      };
      topicAccuracy.push(item);

      if (pct < 70 && stat.total >= 5) {
        weakTopics.push({
          topicId: stat.id,
          topicName: stat.name,
          accuracy: pct,
          totalAttempted: stat.total,
        });
      }
    });

    const difficultyAccuracy = {
      easy: diffStats.easy.total > 0 ? Math.round((diffStats.easy.correct / diffStats.easy.total) * 100) : 0,
      medium: diffStats.medium.total > 0 ? Math.round((diffStats.medium.correct / diffStats.medium.total) * 100) : 0,
      tough: diffStats.tough.total > 0 ? Math.round((diffStats.tough.correct / diffStats.tough.total) * 100) : 0,
    };

    return successResponse(res, {
      testsAttempted,
      averageScore,
      bestScore,
      questionsAttempted: totalQuestionsAttempted,
      accuracy: overallAccuracy,
      scoreHistory,
      topicAccuracy,
      difficultyAccuracy,
      weakTopics,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProgress,
};
