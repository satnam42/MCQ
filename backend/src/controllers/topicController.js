const { Topic, Subtopic, Question, DailyQuizQuestion, TestAnswer, TestAttempt, sequelize } = require('../models');
const { Op } = require('sequelize');
const questionGeneratorService = require('../services/questionGeneratorService');
const contentStatusService = require('../services/contentStatusService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const getTopics = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { status } = req.query;

    const rawTopics = await Topic.findAll({
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
      order: [['created_at', 'DESC'], ['name', 'ASC']],
    });

    const newCountsMap = await contentStatusService.getNewQuestionCountsByTopic();
    const enrichedTopics = await contentStatusService.enrichContentList(rawTopics, 'topic', userId);
    
    const topicsWithNewCount = enrichedTopics.map((t) => ({
      ...t,
      newQuestionCount: newCountsMap[t.id] || 0,
    }));

    const filteredTopics = contentStatusService.filterByStatus(topicsWithNewCount, status);

    return successResponse(res, { topics: filteredTopics }, 'Topics list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getTopicQuestions = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const limit = parseInt(req.query.limit || 50, 10);
    const difficulty = req.query.difficulty; // 'easy', 'medium', 'tough', or null/all
    const repetitionMode = req.query.repetitionMode || 'mix'; // 'mix', 'only_new', or 'recent_new'
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

    const enrichedQuestions = await contentStatusService.enrichContentList(generatedQuestions, 'question', userId);

    const formattedQuestions = enrichedQuestions.map((q, index) => ({
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
      isNew: Boolean(q.isNew),
      isSeen: Boolean(q.isSeen),
      isUnseen: Boolean(q.isUnseen),
      newUntil: q.newUntil,
    }));

    return successResponse(
      res,
      {
        topic: { id: topic.id, name: topic.name },
        totalQuestions: formattedQuestions.length,
        questions: formattedQuestions,
        message: generatedQuestions.message || null,
        partialRemaining: generatedQuestions.partialRemaining || false,
      },
      'Topic practice questions retrieved'
    );
  } catch (err) {
    next(err);
  }
};

const deleteTopic = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { topicId } = req.params;

    if (!topicId || isNaN(parseInt(topicId, 10))) {
      await t.rollback();
      return errorResponse(res, 'Invalid topic ID', 'INVALID_TOPIC_ID', 400);
    }

    const topic = await Topic.findByPk(topicId, { transaction: t });
    if (!topic) {
      await t.rollback();
      return errorResponse(res, 'Topic not found', 'TOPIC_NOT_FOUND', 404);
    }

    const topicName = topic.name;

    // Count questions belonging to topic
    const questionCount = await Question.count({
      where: { topic_id: topicId },
      transaction: t,
    });

    // Fetch question IDs to clean up related junction/reference tables
    const questions = await Question.findAll({
      where: { topic_id: topicId },
      attributes: ['id'],
      transaction: t,
    });
    const questionIds = questions.map((q) => q.id);

    if (questionIds.length > 0) {
      if (DailyQuizQuestion) {
        await DailyQuizQuestion.destroy({
          where: { question_id: { [Op.in]: questionIds } },
          transaction: t,
        });
      }

      if (TestAnswer) {
        await TestAnswer.destroy({
          where: { question_id: { [Op.in]: questionIds } },
          transaction: t,
        });
      }

      await Question.destroy({
        where: { topic_id: topicId },
        transaction: t,
      });
    }

    if (Subtopic) {
      await Subtopic.destroy({
        where: { topic_id: topicId },
        transaction: t,
      });
    }

    if (TestAttempt) {
      await TestAttempt.destroy({
        where: { topic_id: topicId },
        transaction: t,
      });
    }

    await topic.destroy({ transaction: t });

    await t.commit();

    return successResponse(
      res,
      {
        topicId: parseInt(topicId, 10),
        topicName,
        deletedQuestions: questionCount,
      },
      'Topic deleted successfully'
    );
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return errorResponse(res, 'Topic name is required', 'TOPIC_NAME_REQUIRED', 400);
    }

    const trimmedName = name.trim();
    let topic = await Topic.findOne({ where: { name: trimmedName } });
    if (topic) {
      return successResponse(res, { topic }, 'Topic already exists');
    }

    topic = await Topic.create({
      name: trimmedName,
      description: description || `ਪੰਜਾਬੀ ਲੈਕਚਰਾਰ ਕੈਡਰ - ${trimmedName}`,
      is_active: true,
    });

    return successResponse(res, { topic }, 'Topic created successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTopics,
  getTopicQuestions,
  deleteTopic,
  createTopic,
};

