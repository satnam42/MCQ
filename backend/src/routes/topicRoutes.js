const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', topicController.getTopics);
router.post('/', authenticate, authorize(['admin']), topicController.createTopic);
router.get('/:topicId/questions', topicController.getTopicQuestions);
router.delete('/:topicId', authenticate, authorize(['admin']), topicController.deleteTopic);

module.exports = router;

