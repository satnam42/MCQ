const { UserContentView } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const recordContentView = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contentType, contentId, contentIds } = req.body;

    if (!contentType || !['topic', 'question', 'note'].includes(contentType.toLowerCase())) {
      return errorResponse(res, 'contentType must be "topic", "question", or "note"', 'INVALID_TYPE', 400);
    }

    const type = contentType.toLowerCase();
    const idsToRecord = [];

    if (Array.isArray(contentIds)) {
      contentIds.forEach((id) => {
        const num = parseInt(id, 10);
        if (!isNaN(num)) idsToRecord.push(num);
      });
    } else if (contentId !== undefined && !isNaN(parseInt(contentId, 10))) {
      idsToRecord.push(parseInt(contentId, 10));
    }

    if (idsToRecord.length === 0) {
      return errorResponse(res, 'No valid contentId or contentIds provided', 'INVALID_ID', 400);
    }

    const payload = idsToRecord.map((cId) => ({
      user_id: userId,
      content_type: type,
      content_id: cId,
      viewed_at: new Date(),
    }));

    await UserContentView.bulkCreate(payload, {
      ignoreDuplicates: true,
    });

    return successResponse(
      res,
      {
        userId,
        contentType: type,
        recordedIds: idsToRecord,
        count: idsToRecord.length,
      },
      'Content view recorded successfully'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  recordContentView,
};
