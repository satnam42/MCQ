const express = require('express');
const router = express.Router();
const dailyQuizController = require('../controllers/dailyQuizController');

router.get('/', dailyQuizController.getTodayQuiz);
router.get('/:date', dailyQuizController.getQuizByDate);

module.exports = router;
