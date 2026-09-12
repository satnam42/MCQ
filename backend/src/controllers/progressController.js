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
        questionsAttempted: 0,
        totalCorrectAnswers: 0,
        totalIncorrectAnswers: 0,
        totalUnanswered: 0,
        overallAccuracy: 0,
        accuracy: 0,
        averageScore: 0,
        bestScore: 0,
        currentStreak: 0,
        bestStreak: 0,
        scoreHistory: [],
        topicAccuracy: [],
        strengths: [],
        weaknesses: [],
        difficultyAccuracy: { easy: 0, medium: 0, tough: 0 },
        recentTests: [],
        timeAnalytics: {
          avgTimePerQuestionSeconds: 0,
          avgTestTimeSeconds: 0,
          fastestTestSeconds: 0,
          slowestTestSeconds: 0,
        },
        weakTopics: [],
      });
    }

    const testsAttempted = attempts.length;
    let totalQuestionsAttempted = 0;
    let totalCorrectAnswers = 0;
    let totalIncorrectAnswers = 0;
    let totalUnanswered = 0;
    let totalTimeTakenSeconds = 0;
    let bestScore = 0;
    const timeTakenList = [];

    const scoreHistory = attempts.map((a, index) => {
      const qCount = a.total_questions || 50;
      const correct = a.correct_answers || a.score || 0;
      const incorrect = a.incorrect_answers || 0;
      const unanswered = a.unanswered || 0;
      const timeSec = a.time_taken_seconds || 0;

      totalQuestionsAttempted += qCount;
      totalCorrectAnswers += correct;
      totalIncorrectAnswers += incorrect;
      totalUnanswered += unanswered;
      totalTimeTakenSeconds += timeSec;
      if (timeSec > 0) timeTakenList.push(timeSec);

      const pct = qCount > 0 ? Math.round((correct / qCount) * 100) : 0;
      if (pct > bestScore) bestScore = pct;

      return {
        testNum: index + 1,
        attemptId: a.id,
        date: a.completed_at || a.started_at,
        score: correct,
        totalQuestions: qCount,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        unanswered: unanswered,
        percentage: pct,
        timeTakenSeconds: timeSec,
        testType: a.test_type,
        topicName: a.topic ? a.topic.name : (a.test_type === 'daily' ? 'Daily Test' : 'General'),
        difficulty: a.difficulty || 'mix',
      };
    });

    const averageScore = Math.round(
      scoreHistory.reduce((acc, curr) => acc + curr.percentage, 0) / testsAttempted
    );

    const overallAccuracy = totalQuestionsAttempted > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100)
      : 0;

    // Streak analytics calculation
    const completedDatesSet = new Set(
      attempts
        .filter((a) => a.completed_at || a.created_at)
        .map((a) => new Date(a.completed_at || a.created_at).toISOString().split('T')[0])
    );
    const sortedDates = Array.from(completedDatesSet).sort();

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    if (sortedDates.length > 0) {
      let prevDate = null;
      sortedDates.forEach((dStr) => {
        const d = new Date(dStr);
        if (!prevDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        prevDate = d;
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let checkDate = completedDatesSet.has(todayStr)
        ? new Date(todayStr)
        : completedDatesSet.has(yesterdayStr)
        ? new Date(yesterdayStr)
        : null;

      while (checkDate) {
        const cStr = checkDate.toISOString().split('T')[0];
        if (completedDatesSet.has(cStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    if (currentStreak === 0 && testsAttempted > 0) {
      currentStreak = 1;
    }
    if (bestStreak < currentStreak) {
      bestStreak = currentStreak;
    }

    // Time analytics
    const avgTimePerQuestionSeconds = totalQuestionsAttempted > 0
      ? Math.round(totalTimeTakenSeconds / totalQuestionsAttempted)
      : 0;
    const avgTestTimeSeconds = testsAttempted > 0
      ? Math.round(totalTimeTakenSeconds / testsAttempted)
      : 0;
    const fastestTestSeconds = timeTakenList.length > 0 ? Math.min(...timeTakenList) : 0;
    const slowestTestSeconds = timeTakenList.length > 0 ? Math.max(...timeTakenList) : 0;

    // Detailed topic & difficulty breakdown from TestAnswers
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

      const diff = q.difficulty ? q.difficulty.toLowerCase() : 'medium';
      if (diffStats[diff]) {
        diffStats[diff].total++;
        if (ans.is_correct) diffStats[diff].correct++;
      }

      const topicId = q.topic_id || (q.topic ? q.topic.id : 'gen');
      const topicName = q.topic ? q.topic.name : 'ਪੰਜਾਬੀ ਸਾਹਿਤ';

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
        percentage: pct,
      };
      topicAccuracy.push(item);

      if (pct < 70 && stat.total >= 3) {
        weakTopics.push({
          topicId: stat.id,
          topicName: stat.name,
          accuracy: pct,
          percentage: pct,
          totalAttempted: stat.total,
        });
      }
    });

    // Sort topic accuracy descending
    topicAccuracy.sort((a, b) => b.accuracy - a.accuracy);

    // Strengths (Top 3) & Weaknesses (Bottom 3)
    const strengths = topicAccuracy.slice(0, 3);
    const weaknesses = [...topicAccuracy].reverse().slice(0, 3);

    const difficultyAccuracy = {
      easy: diffStats.easy.total > 0 ? Math.round((diffStats.easy.correct / diffStats.easy.total) * 100) : 0,
      medium: diffStats.medium.total > 0 ? Math.round((diffStats.medium.correct / diffStats.medium.total) * 100) : 0,
      tough: diffStats.tough.total > 0 ? Math.round((diffStats.tough.correct / diffStats.tough.total) * 100) : 0,
    };

    // Recent tests sorted newest first (up to 10)
    const recentTests = [...scoreHistory].reverse().slice(0, 10);

    return successResponse(res, {
      testsAttempted,
      questionsAttempted: totalQuestionsAttempted,
      totalCorrectAnswers,
      totalIncorrectAnswers,
      totalUnanswered,
      overallAccuracy,
      accuracy: overallAccuracy,
      averageScore,
      bestScore,
      currentStreak,
      bestStreak,
      scoreHistory,
      topicAccuracy,
      strengths,
      weaknesses,
      difficultyAccuracy,
      recentTests,
      timeAnalytics: {
        avgTimePerQuestionSeconds,
        avgTestTimeSeconds,
        fastestTestSeconds,
        slowestTestSeconds,
      },
      weakTopics,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProgress,
};
