const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/start', testController.startTest);
router.post('/:attemptId/submit', testController.submitTest);
router.get('/history', testController.getHistory);
router.get('/incorrect-questions', testController.getIncorrectQuestions);
router.get('/:attemptId/result', testController.getResultDetail);

module.exports = router;
