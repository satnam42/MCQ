const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');

router.get('/', topicController.getTopics);
router.get('/:topicId/questions', topicController.getTopicQuestions);

module.exports = router;
