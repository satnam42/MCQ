const { Topic, Subtopic, Question, sequelize } = require('../models');
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
    const limit = parseInt(req.query.limit || 10, 10);
    const difficulty = req.query.difficulty; // 'easy', 'medium', 'tough', or null/all

    const topic = await Topic.findByPk(topicId);
    if (!topic) {
      return errorResponse(res, 'Topic not found', 'TOPIC_NOT_FOUND', 404);
    }

    const whereClause = {
      topic_id: topicId,
      is_active: true,
    };

    if (difficulty && ['easy', 'medium', 'tough'].includes(difficulty.toLowerCase())) {
      whereClause.difficulty = difficulty.toLowerCase();
    }

    const questions = await Question.findAll({
      where: whereClause,
      limit,
      order: sequelize.random(),
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
        { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
      ],
    });

    const formattedQuestions = questions.map((q, index) => ({
      order: index + 1,
      id: q.id,
      question: q.question,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      topicId: q.topic_id,
      topicName: q.topic ? q.topic.name : '',
      subtopicName: q.subtopic ? q.subtopic.name : '',
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
