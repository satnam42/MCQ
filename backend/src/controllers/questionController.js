const { Question, Topic, Subtopic, DailyQuiz, User, sequelize } = require('../models');
const duplicateDetectorService = require('../services/duplicateDetectorService');
const questionImportService = require('../services/questionImportService');
const questionGeneratorService = require('../services/questionGeneratorService');
const { normalizePunjabiText } = require('../utils/normalizer');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { Op } = require('sequelize');

const listQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 20, 10);
    const offset = (page - 1) * limit;

    const { search, topicId, difficulty, isVerified, isActive } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { question: { [Op.like]: `%${search}%` } },
        { option_a: { [Op.like]: `%${search}%` } },
        { option_b: { [Op.like]: `%${search}%` } },
        { option_c: { [Op.like]: `%${search}%` } },
        { option_d: { [Op.like]: `%${search}%` } },
        { explanation: { [Op.like]: `%${search}%` } },
      ];
    }

    if (topicId) where.topic_id = topicId;
    if (difficulty) where.difficulty = difficulty;
    if (isVerified !== undefined) where.is_verified = isVerified === 'true';
    if (isActive !== undefined) where.is_active = isActive === 'true';

    const { rows: questions, count } = await Question.findAndCountAll({
      where,
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
        { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
      ],
      order: [['id', 'DESC']],
      limit,
      offset,
    });

    // Statistics counts for Admin Dashboard
    const totalQuestions = await Question.count();
    const verifiedQuestions = await Question.count({ where: { is_verified: true } });
    const easyCount = await Question.count({ where: { difficulty: 'easy' } });
    const mediumCount = await Question.count({ where: { difficulty: 'medium' } });
    const toughCount = await Question.count({ where: { difficulty: 'tough' } });
    const totalTopics = await Topic.count();
    const totalDailyQuizzes = await DailyQuiz.count();
    const totalCandidates = await User.count({ where: { role: 'candidate' } });

    return successResponse(res, {
      stats: {
        totalQuestions,
        verifiedQuestions,
        easyCount,
        mediumCount,
        toughCount,
        totalTopics,
        totalDailyQuizzes,
        totalCandidates,
      },
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      questions,
    });
  } catch (err) {
    next(err);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const {
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation,
      topicId,
      subtopicId,
      difficulty = 'medium',
      language = 'Punjabi',
      source,
      sourceUrl,
      isVerified = true,
      isActive = true,
    } = req.body;

    // Check duplicate
    const dupCheck = await duplicateDetectorService.checkDuplicate(question);
    if (dupCheck.isDuplicate) {
      return errorResponse(res, `Duplicate question: ${dupCheck.reason}`, 'DUPLICATE_QUESTION', 400);
    }

    const newQuestion = await Question.create({
      question,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
      explanation,
      topic_id: topicId,
      subtopic_id: subtopicId || null,
      difficulty,
      language,
      source,
      source_url: sourceUrl || null,
      is_verified: isVerified,
      is_active: isActive,
      normalized_text: normalizePunjabiText(question),
    });

    const created = await Question.findByPk(newQuestion.id, {
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
        { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
      ],
    });

    return successResponse(res, { question: created }, 'Question created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const questionRecord = await Question.findByPk(id);
    if (!questionRecord) {
      return errorResponse(res, 'Question not found', 'QUESTION_NOT_FOUND', 404);
    }

    const {
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation,
      topicId,
      subtopicId,
      difficulty,
      language,
      source,
      sourceUrl,
      isVerified,
      isActive,
    } = req.body;

    if (question && question !== questionRecord.question) {
      const dupCheck = await duplicateDetectorService.checkDuplicate(question, id);
      if (dupCheck.isDuplicate) {
        return errorResponse(res, `Duplicate question: ${dupCheck.reason}`, 'DUPLICATE_QUESTION', 400);
      }
      questionRecord.question = question;
      questionRecord.normalized_text = normalizePunjabiText(question);
    }

    if (optionA) questionRecord.option_a = optionA;
    if (optionB) questionRecord.option_b = optionB;
    if (optionC) questionRecord.option_c = optionC;
    if (optionD) questionRecord.option_d = optionD;
    if (correctOption) questionRecord.correct_option = correctOption;
    if (explanation !== undefined) questionRecord.explanation = explanation;
    if (topicId) questionRecord.topic_id = topicId;
    if (subtopicId !== undefined) questionRecord.subtopic_id = subtopicId;
    if (difficulty) questionRecord.difficulty = difficulty;
    if (language) questionRecord.language = language;
    if (source !== undefined) questionRecord.source = source;
    if (sourceUrl !== undefined) questionRecord.source_url = sourceUrl;
    if (isVerified !== undefined) questionRecord.is_verified = isVerified;
    if (isActive !== undefined) questionRecord.is_active = isActive;

    await questionRecord.save();

    const updated = await Question.findByPk(id, {
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
        { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
      ],
    });

    return successResponse(res, { question: updated }, 'Question updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);
    if (!question) {
      return errorResponse(res, 'Question not found', 'QUESTION_NOT_FOUND', 404);
    }

    await question.destroy();
    return successResponse(res, { id }, 'Question deleted successfully');
  } catch (err) {
    next(err);
  }
};

const importQuestions = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No CSV file uploaded', 'FILE_REQUIRED', 400);
    }

    const summary = await questionImportService.importQuestionsFromCSVBuffer(req.file.buffer);
    return successResponse(res, { summary }, 'CSV question import completed');
  } catch (err) {
    next(err);
  }
};

const importQuestionsJSON = async (req, res, next) => {
  try {
    let jsonData = req.body.jsonContent || req.body.jsonData || req.body;

    if (req.file) {
      jsonData = req.file.buffer.toString('utf-8');
    }

    if (!jsonData || (typeof jsonData === 'object' && Object.keys(jsonData).length === 0 && !req.file)) {
      return errorResponse(res, 'No JSON content or file provided', 'JSON_REQUIRED', 400);
    }

    const summary = await questionImportService.importQuestionsFromJSON(jsonData);
    return successResponse(res, { summary }, 'JSON question import completed');
  } catch (err) {
    next(err);
  }
};

const generatePreview = async (req, res, next) => {
  try {
    const { topicId, topicName, difficulty, count = 10, strategy = 'local' } = req.body;
    const questions = await questionGeneratorService.generate(
      { topicId, topicName, difficulty, limit: count, count },
      strategy
    );
    return successResponse(res, { strategy, questions }, 'Preview questions generated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  importQuestionsJSON,
  generatePreview,
};
