const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dailyQuizRoutes = require('./dailyQuizRoutes');
const testRoutes = require('./testRoutes');
const topicRoutes = require('./topicRoutes');
const progressRoutes = require('./progressRoutes');
const questionRoutes = require('./questionRoutes');
const noteRoutes = require('./noteRoutes');
const settingsRoutes = require('./settingsRoutes');
const contentViewRoutes = require('./contentViewRoutes');
const permissionRoutes = require('./permissionRoutes');
const testLimitRoutes = require('./testLimitRoutes');
const mockTestRoutes = require('./mockTestRoutes');

router.use('/auth', authRoutes);
router.use('/daily-quiz', dailyQuizRoutes);
router.use('/tests', testRoutes);
router.use('/topics', topicRoutes);
router.use('/progress', progressRoutes);
router.use('/questions', questionRoutes);
router.use('/notes', noteRoutes);
router.use('/settings', settingsRoutes);
router.use('/content', contentViewRoutes);
router.use('/permissions', permissionRoutes);
router.use('/test-limits', testLimitRoutes);
router.use('/mock-tests', mockTestRoutes);
router.use('/admin/mock-tests', mockTestRoutes);

module.exports = router;


