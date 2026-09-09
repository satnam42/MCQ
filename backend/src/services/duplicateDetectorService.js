const { Question } = require('../models');
const { normalizePunjabiText } = require('../utils/normalizer');
const { Op } = require('sequelize');

class DuplicateDetectorService {
  /**
   * Checks if a question text is a duplicate of any existing question in the database.
   * Uses both normalized text matching and Levenshtein similarity.
   */
  async checkDuplicate(questionText, excludeId = null) {
    const normalized = normalizePunjabiText(questionText);
    if (!normalized) return { isDuplicate: false };

    const whereClause = {
      normalized_text: normalized,
    };

    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    // Direct normalized match check
    const exactMatch = await Question.findOne({
      where: whereClause,
    });

    if (exactMatch) {
      return {
        isDuplicate: true,
        reason: 'Exact duplicate question found in database',
        existingQuestionId: exactMatch.id,
      };
    }

    // Substring/Prefix similarity check if question is long enough
    if (normalized.length > 20) {
      const existingQuestions = await Question.findAll({
        attributes: ['id', 'question', 'normalized_text'],
        where: excludeId ? { id: { [Op.ne]: excludeId } } : {},
      });

      for (const q of existingQuestions) {
        if (!q.normalized_text) continue;
        const similarity = this.calculateSimilarity(normalized, q.normalized_text);
        if (similarity > 0.90) {
          return {
            isDuplicate: true,
            reason: `Highly similar question found (${Math.round(similarity * 100)}% match)`,
            existingQuestionId: q.id,
          };
        }
      }
    }

    return { isDuplicate: false };
  }

  calculateSimilarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) {
      return 1.0;
    }
    return (longerLength - this.editDistance(longer, shorter)) / parseFloat(longerLength);
  }

  editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }
}

module.exports = new DuplicateDetectorService();
