const { Topic, Subtopic, Question, sequelize } = require('../models');
const questionGeneratorService = require('../services/questionGeneratorService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const getTopics = async (req, res, next) => {
  try {
    const topics = await Topic.findAll({
      where: { is_active: true },
      include: [
        { model: Subtopic, as: 'subtopics', attributes: ['id', 'name', 'description'] },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM questions AS q
              WHERE q.topic_id = Topic.id AND q.is_active = true
            )`),
            'questionCount',
          ],
        ],
      },
      order: [['name', 'ASC']],
    });

    return successResponse(res, { topics }, 'Topics list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getTopicQuestions = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const limit = parseInt(req.query.limit || 50, 10);
    const difficulty = req.query.difficulty; // 'easy', 'medium', 'tough', or null/all
    const repetitionMode = req.query.repetitionMode || 'mix'; // 'mix' or 'only_new'
    const userId = req.user ? req.user.id : null;

    const topic = await Topic.findByPk(topicId);
    if (!topic) {
      return errorResponse(res, 'Topic not found', 'TOPIC_NOT_FOUND', 404);
    }

    const generatedQuestions = await questionGeneratorService.generate({
      topicId,
      difficulty,
      limit,
      userId,
      repetitionMode,
    });

    const formattedQuestions = generatedQuestions.map((q, index) => ({
      order: index + 1,
      id: q.id,
      question: q.question,
      options: q.options || {
        A: q.optionA,
        B: q.optionB,
        C: q.optionC,
        D: q.optionD,
      },
      topicId: q.topicId || topic.id,
      topicName: q.topicName || topic.name,
      subtopicName: q.subtopicName || q.subtopic || '',
      difficulty: q.difficulty,
      source: q.source,
    }));

    return successResponse(
      res,
      {
        topic: { id: topic.id, name: topic.name },
        totalQuestions: formattedQuestions.length,
        questions: formattedQuestions,
      },
      'Topic practice questions retrieved'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTopics,
  getTopicQuestions,
};
