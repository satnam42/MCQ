const dailyQuizService = require('../services/dailyQuizService');
const { successResponse } = require('../utils/responseFormatter');

const getTodayQuiz = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const quiz = await dailyQuizService.getOrGenerateDailyQuiz(todayStr);
    return successResponse(res, quiz, "Today's daily quiz retrieved successfully");
  } catch (err) {
    next(err);
  }
};

const getQuizByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const quiz = await dailyQuizService.getOrGenerateDailyQuiz(date);
    return successResponse(res, quiz, `Daily quiz for ${date} retrieved successfully`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTodayQuiz,
  getQuizByDate,
};
