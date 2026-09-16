const { SystemSetting, UserContentView } = require('../models');
const { Op } = require('sequelize');

class ContentStatusService {
  /**
   * Retrieves configured "New Content Duration" in days (default: 7).
   */
  async getNewContentDurationDays() {
    try {
      const setting = await SystemSetting.findByPk('new_content_duration_days');
      if (setting && setting.value) {
        const val = parseInt(setting.value, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (err) {
      console.error('Error fetching new_content_duration_days setting:', err);
    }
    return 7; // Default 7 days
  }

  /**
   * Retrieves or initializes feature deployment date.
   * Existing content created before this date will NOT be marked as NEW.
   */
  async getFeatureDeploymentDate() {
    try {
      let setting = await SystemSetting.findByPk('feature_deployment_date');
      if (!setting) {
        // Initialize deployment date to current timestamp if not set
        const nowIso = new Date().toISOString();
        setting = await SystemSetting.create({
          key: 'feature_deployment_date',
          value: nowIso,
          description: 'Timestamp when dynamic new tag feature was deployed',
        });
      }
      return new Date(setting.value);
    } catch (err) {
      console.error('Error fetching feature_deployment_date:', err);
      return new Date('2026-09-01T00:00:00.000Z'); // Fallback
    }
  }

  /**
   * Updates configurable new content duration in days.
   */
  async updateNewContentDurationDays(days) {
    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      throw new Error('New content duration must be a valid number of days between 1 and 365.');
    }

    let setting = await SystemSetting.findByPk('new_content_duration_days');
    if (!setting) {
      setting = await SystemSetting.create({
        key: 'new_content_duration_days',
        value: String(numDays),
        description: 'Duration in days that newly created content retains the [NEW] badge',
      });
    } else {
      setting.value = String(numDays);
      await setting.save();
    }
    return numDays;
  }

  /**
   * Batches user view lookup and enriches items with isNew, isSeen, newUntil status.
   */
  async enrichContentList(items = [], contentType = 'topic', userId = null) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const durationDays = await this.getNewContentDurationDays();
    const deploymentDate = await this.getFeatureDeploymentDate();

    const itemIds = items.map((i) => i.id || i.dataValues?.id).filter(Boolean);

    // Single batched query for user seen status
    const seenIdsSet = new Set();
    if (userId && itemIds.length > 0) {
      const views = await UserContentView.findAll({
        where: {
          user_id: userId,
          content_type: contentType,
          content_id: { [Op.in]: itemIds },
        },
        attributes: ['content_id'],
      });
      views.forEach((v) => seenIdsSet.add(v.content_id));
    }

    const now = new Date();

    return items.map((rawItem) => {
      const item = rawItem.toJSON ? rawItem.toJSON() : { ...rawItem };
      const createdAtRaw = item.createdAt || item.created_at || item.createdDate;
      const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
      const isValidDate = createdAt && !isNaN(createdAt.getTime());

      // Calculate dynamic expiration timestamp
      const newUntil = isValidDate ? new Date(createdAt.getTime() + durationDays * 86400 * 1000) : null;

      // Check if item was created after feature deployment AND current time is before expiration
      const isCreatedAfterDeployment = Boolean(isValidDate && createdAt >= deploymentDate);
      const isNew = Boolean(isCreatedAfterDeployment && newUntil && now < newUntil);
      const isSeen = seenIdsSet.has(item.id);

      return {
        ...item,
        createdAt: isValidDate ? createdAt : null,
        created_at: isValidDate ? createdAt : null,
        isNew,
        isSeen,
        isUnseen: !isSeen,
        newUntil: newUntil ? newUntil.toISOString() : null,
      };
    });
  }

  /**
   * Filters enriched items list by status filter.
   * Supported status values: 'all', 'new', 'unseen', 'seen', 'expired_new'
   */
  filterByStatus(items = [], statusFilter = 'all') {
    if (!statusFilter || statusFilter === 'all') {
      return items;
    }

    const filter = statusFilter.toLowerCase();
    if (filter === 'new') {
      return items.filter((i) => i.isNew);
    }
    if (filter === 'unseen') {
      return items.filter((i) => i.isUnseen);
    }
    if (filter === 'seen') {
      return items.filter((i) => i.isSeen);
    }
    if (filter === 'expired_new' || filter === 'expired') {
      return items.filter((i) => !i.isNew);
    }
    return items;
  }

  /**
   * Retrieves map of topic_id -> newQuestionCount based on current dynamic NEW criteria
   */
  async getNewQuestionCountsByTopic() {
    try {
      const { Question } = require('../models');
      const durationDays = await this.getNewContentDurationDays();
      const deploymentDate = await this.getFeatureDeploymentDate();

      const minCreatedAt = new Date(Math.max(
        deploymentDate.getTime(),
        Date.now() - durationDays * 86400 * 1000
      ));

      const newQuestions = await Question.findAll({
        where: {
          is_active: true,
          created_at: { [Op.gte]: minCreatedAt },
        },
        attributes: ['id', 'topic_id'],
      });

      const countMap = {};
      newQuestions.forEach((q) => {
        if (q.topic_id) {
          countMap[q.topic_id] = (countMap[q.topic_id] || 0) + 1;
        }
      });
      return countMap;
    } catch (err) {
      console.error('Error calculating new question counts per topic:', err);
      return {};
    }
  }
}

module.exports = new ContentStatusService();
