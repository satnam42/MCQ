const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dailyQuizRoutes = require('./dailyQuizRoutes');
const testRoutes = require('./testRoutes');
const topicRoutes = require('./topicRoutes');
const progressRoutes = require('./progressRoutes');
const questionRoutes = require('./questionRoutes');
const noteRoutes = require('./noteRoutes');

router.use('/auth', authRoutes);
router.use('/daily-quiz', dailyQuizRoutes);
router.use('/tests', testRoutes);
router.use('/topics', topicRoutes);
router.use('/progress', progressRoutes);
router.use('/questions', questionRoutes);
router.use('/notes', noteRoutes);

module.exports = router;

