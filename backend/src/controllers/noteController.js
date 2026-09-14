const { Note, Topic, User } = require('../models');
const { parseTextToHtml, sanitizeHtmlContent } = require('../services/noteParserService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Upload & Create Note
 */
const createNote = async (req, res, next) => {
  try {
    const { topicId, title } = req.body;
    let rawContent = req.body.rawContent || req.body.raw_content;
    let originalFileName = 'note.txt';

    // Check if file was uploaded via multer
    if (req.file) {
      originalFileName = req.file.originalname;
      rawContent = req.file.buffer.toString('utf-8');
    }

    if (!topicId || isNaN(parseInt(topicId, 10))) {
      return errorResponse(res, 'Valid topicId is required.', 'INVALID_TOPIC_ID', 400);
    }

    if (!title || !title.trim()) {
      return errorResponse(res, 'Note title is required.', 'TITLE_REQUIRED', 400);
    }

    if (!rawContent || !rawContent.trim()) {
      return errorResponse(res, 'File content cannot be empty.', 'EMPTY_CONTENT', 400);
    }

    // Verify topic exists
    const topic = await Topic.findByPk(topicId);
    if (!topic) {
      return errorResponse(res, 'Selected topic does not exist.', 'TOPIC_NOT_FOUND', 404);
    }

    // Convert raw text to sanitized HTML
    const htmlContent = sanitizeHtmlContent(parseTextToHtml(rawContent));

    const note = await Note.create({
      topic_id: parseInt(topicId, 10),
      title: title.trim(),
      original_file_name: originalFileName,
      raw_content: rawContent,
      html_content: htmlContent,
      status: 'active',
      created_by: req.user ? req.user.id : null,
    });

    const noteWithTopic = await Note.findByPk(note.id, {
      include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
    });

    return successResponse(res, { note: noteWithTopic }, 'Note uploaded and created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Preview Parsed HTML Note (Before Saving)
 */
const previewNote = async (req, res, next) => {
  try {
    let rawContent = req.body.rawContent || req.body.raw_content;
    let originalFileName = 'note.txt';

    if (req.file) {
      originalFileName = req.file.originalname;
      rawContent = req.file.buffer.toString('utf-8');
    }

    if (!rawContent || !rawContent.trim()) {
      return errorResponse(res, 'File content cannot be empty.', 'EMPTY_CONTENT', 400);
    }

    const htmlContent = sanitizeHtmlContent(parseTextToHtml(rawContent));

    return successResponse(
      res,
      {
        originalFileName,
        rawContent,
        htmlContent,
      },
      'Note preview generated successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get Notes (By Topic or All)
 */
const getNotes = async (req, res, next) => {
  try {
    const { topicId, status } = req.query;
    const whereClause = {};

    if (topicId && !isNaN(parseInt(topicId, 10))) {
      whereClause.topic_id = parseInt(topicId, 10);
    }

    // Non-admin requests only get active notes by default
    if (status) {
      whereClause.status = status;
    } else if (!req.user || req.user.role !== 'admin') {
      whereClause.status = 'active';
    }

    const notes = await Note.findAll({
      where: whereClause,
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name', 'description'] },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return successResponse(res, { notes }, 'Notes retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Get Single Note
 */
const getNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Note.findByPk(id, {
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name', 'description'] },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!note) {
      return errorResponse(res, 'Note not found', 'NOTE_NOT_FOUND', 404);
    }

    return successResponse(res, { note }, 'Note details retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Update Note (Admin Only)
 */
const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, topicId, status } = req.body;
    let rawContent = req.body.rawContent || req.body.raw_content;

    const note = await Note.findByPk(id);
    if (!note) {
      return errorResponse(res, 'Note not found', 'NOTE_NOT_FOUND', 404);
    }

    if (req.file) {
      note.original_file_name = req.file.originalname;
      rawContent = req.file.buffer.toString('utf-8');
    }

    if (title && title.trim()) {
      note.title = title.trim();
    }

    if (topicId && !isNaN(parseInt(topicId, 10))) {
      const topic = await Topic.findByPk(topicId);
      if (!topic) {
        return errorResponse(res, 'Topic not found', 'TOPIC_NOT_FOUND', 404);
      }
      note.topic_id = parseInt(topicId, 10);
    }

    if (status && ['active', 'disabled'].includes(status)) {
      note.status = status;
    }

    if (rawContent && rawContent.trim()) {
      note.raw_content = rawContent;
      note.html_content = sanitizeHtmlContent(parseTextToHtml(rawContent));
    }

    await note.save();

    const updatedNote = await Note.findByPk(note.id, {
      include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
    });

    return successResponse(res, { note: updatedNote }, 'Note updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Note (Admin Only)
 */
const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Note.findByPk(id);

    if (!note) {
      return errorResponse(res, 'Note not found', 'NOTE_NOT_FOUND', 404);
    }

    await note.destroy();

    return successResponse(res, { id: parseInt(id, 10) }, 'Note deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNote,
  previewNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
