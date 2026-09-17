const { Note, Topic, User, sequelize } = require('../models');
const { parseTextToHtml, sanitizeHtmlContent } = require('../services/noteParserService');
const contentStatusService = require('../services/contentStatusService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Upload & Create Note (Single Note Upload)
 */
const createNote = async (req, res, next) => {
  try {
    let { topicId, title } = req.body;
    let rawContent = req.body.rawContent || req.body.raw_content;
    let originalFileName = 'note.txt';

    // Check if file was uploaded via multer
    if (req.file) {
      originalFileName = req.file.originalname;
      const fileBuffer = req.file.buffer.toString('utf-8');

      // If uploaded file is JSON, route to bulk JSON handler
      if (req.file.originalname.endsWith('.json') || req.file.mimetype.includes('json')) {
        return bulkImportNotes(req, res, next);
      }
      rawContent = fileBuffer;
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
 * Bulk Import Notes via JSON File or JSON Array
 */
const bulkImportNotes = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    let notesData = [];
    let originalFileName = 'bulk_notes.json';

    if (req.file) {
      originalFileName = req.file.originalname;
      const fileText = req.file.buffer.toString('utf-8');
      try {
        const parsedJson = JSON.parse(fileText);
        if (Array.isArray(parsedJson)) {
          notesData = parsedJson;
        } else if (parsedJson && Array.isArray(parsedJson.notes)) {
          notesData = parsedJson.notes;
        } else if (parsedJson && typeof parsedJson === 'object') {
          notesData = [parsedJson];
        }
      } catch (jsonErr) {
        await t.rollback();
        return errorResponse(res, `Invalid JSON syntax in file "${originalFileName}": ${jsonErr.message}`, 'INVALID_JSON_SYNTAX', 400);
      }
    } else if (req.body.notes && Array.isArray(req.body.notes)) {
      notesData = req.body.notes;
    }

    if (!notesData || notesData.length === 0) {
      await t.rollback();
      return errorResponse(res, 'No notes found in uploaded JSON. Expected an array of note objects.', 'EMPTY_JSON_DATA', 400);
    }

    const createdNotes = [];
    let createdTopicsCount = 0;
    const topicMap = new Map();

    for (let i = 0; i < notesData.length; i++) {
      const item = notesData[i];
      const itemTitle = item.title ? item.title.trim() : null;
      const itemContent = item.content || item.raw_content || item.rawContent;
      const topicName = item.topic ? item.topic.trim() : null;
      const topicId = item.topicId || item.topic_id;

      if (!itemTitle) {
        await t.rollback();
        return errorResponse(res, `Note at index ${i} is missing a "title".`, 'MISSING_TITLE', 400);
      }

      if (!itemContent || !itemContent.trim()) {
        await t.rollback();
        return errorResponse(res, `Note "${itemTitle}" at index ${i} has empty content.`, 'EMPTY_NOTE_CONTENT', 400);
      }

      let targetTopicId = null;

      if (topicId && !isNaN(parseInt(topicId, 10))) {
        targetTopicId = parseInt(topicId, 10);
      } else if (topicName) {
        let topicObj = topicMap.get(topicName);
        if (!topicObj) {
          topicObj = await Topic.findOne({ where: { name: topicName }, transaction: t });
          if (!topicObj) {
            topicObj = await Topic.create(
              {
                name: topicName,
                description: `ਪੰਜਾਬੀ ਲੈਕਚਰਾਰ ਕੈਡਰ - ${topicName}`,
                is_active: true,
              },
              { transaction: t }
            );
            createdTopicsCount++;
          }
          topicMap.set(topicName, topicObj);
        }
        targetTopicId = topicObj.id;
      }

      if (!targetTopicId) {
        await t.rollback();
        return errorResponse(res, `Note "${itemTitle}" at index ${i} requires either a "topic" name or "topicId".`, 'MISSING_TOPIC', 400);
      }

      const htmlContent = sanitizeHtmlContent(parseTextToHtml(itemContent));

      const newNote = await Note.create(
        {
          topic_id: targetTopicId,
          title: itemTitle,
          original_file_name: originalFileName,
          raw_content: itemContent,
          html_content: htmlContent,
          status: 'active',
          created_by: req.user ? req.user.id : null,
        },
        { transaction: t }
      );

      createdNotes.push(newNote);
    }

    await t.commit();

    const resultNotes = await Note.findAll({
      where: { id: createdNotes.map((n) => n.id) },
      include: [{ model: Topic, as: 'topic', attributes: ['id', 'name'] }],
    });

    return successResponse(
      res,
      {
        importedCount: resultNotes.length,
        createdTopicsCount,
        notes: resultNotes,
      },
      `Successfully imported ${resultNotes.length} note(s) from JSON.`,
      201
    );
  } catch (err) {
    await t.rollback();
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
    let isJson = false;
    let parsedNotes = [];

    if (req.file) {
      originalFileName = req.file.originalname;
      const fileText = req.file.buffer.toString('utf-8');

      if (req.file.originalname.endsWith('.json') || req.file.mimetype.includes('json')) {
        isJson = true;
        try {
          const parsed = JSON.parse(fileText);
          const list = Array.isArray(parsed) ? parsed : (parsed.notes || [parsed]);
          parsedNotes = list.map((item) => {
            const content = item.content || item.raw_content || item.rawContent || '';
            return {
              title: item.title || 'Untitled Note',
              topic: item.topic || 'General',
              rawContent: content,
              htmlContent: sanitizeHtmlContent(parseTextToHtml(content)),
            };
          });
        } catch (jsonErr) {
          return errorResponse(res, `Invalid JSON syntax: ${jsonErr.message}`, 'INVALID_JSON', 400);
        }
      } else {
        rawContent = fileText;
      }
    }

    if (isJson) {
      return successResponse(
        res,
        {
          isJson: true,
          originalFileName,
          count: parsedNotes.length,
          previewNotes: parsedNotes,
        },
        'Bulk JSON preview generated successfully'
      );
    }

    if (!rawContent || !rawContent.trim()) {
      return errorResponse(res, 'File content cannot be empty.', 'EMPTY_CONTENT', 400);
    }

    const htmlContent = sanitizeHtmlContent(parseTextToHtml(rawContent));

    return successResponse(
      res,
      {
        isJson: false,
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
    const { topicId, status, contentStatus } = req.query;
    const userId = req.user ? req.user.id : null;
    const whereClause = {};

    if (topicId && !isNaN(parseInt(topicId, 10))) {
      whereClause.topic_id = parseInt(topicId, 10);
    }

    if (status && ['active', 'inactive', 'archived'].includes(status)) {
      whereClause.status = status;
    } else if (!req.user || req.user.role !== 'admin') {
      whereClause.status = 'active';
    }

    const rawNotes = await Note.findAll({
      where: whereClause,
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name', 'description'] },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const enrichedNotes = await contentStatusService.enrichContentList(rawNotes, 'note', userId);
    const filterTag = contentStatus || (status && !['active', 'inactive', 'archived'].includes(status) ? status : null);
    const filteredNotes = contentStatusService.filterByStatus(enrichedNotes, filterTag);

    return successResponse(res, { notes: filteredNotes }, 'Notes retrieved successfully');
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
  bulkImportNotes,
  previewNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
