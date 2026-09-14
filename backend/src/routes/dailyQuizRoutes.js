const express = require('express');
const router = express.Router();
const dailyQuizController = require('../controllers/dailyQuizController');
const { optionalAuthenticate } = require('../middleware/auth');

router.use(optionalAuthenticate);

router.get('/', dailyQuizController.getTodayQuiz);
router.get('/:date', dailyQuizController.getQuizByDate);

module.exports = router;
