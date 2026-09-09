const csvParser = require('csv-parser');
const stream = require('stream');
const { sequelize, Question, Topic, Subtopic } = require('../models');
const duplicateDetectorService = require('./duplicateDetectorService');
const { normalizePunjabiText } = require('../utils/normalizer');

class QuestionImportService {
  /**
   * Parses CSV buffer or text and imports questions into MySQL/SQLite database.
   * Processes ALL records in the file. If a record is already present in DB (or repeated in batch),
   * it skips that record with a clear skip log and continues processing the next record.
   */
  async importQuestionsFromCSVBuffer(fileBuffer) {
    const rows = await this.parseCSVBuffer(fileBuffer);
    return await this.processImportRows(rows);
  }

  /**
   * Parses JSON string or JSON array/object and imports questions into database.
   * Handles direct JSON copy-pasted text or uploaded .json files.
   */
  async importQuestionsFromJSON(jsonData) {
    let rows = [];

    if (typeof jsonData === 'string') {
      try {
        rows = JSON.parse(jsonData);
      } catch (err) {
        return {
          totalRows: 0,
          successful: 0,
          skipped: 0,
          duplicates: 0,
          failed: 1,
          invalid: 1,
          errors: [{ row: 0, message: `Invalid JSON syntax: ${err.message}` }],
        };
      }
    } else if (Array.isArray(jsonData)) {
      rows = jsonData;
    } else if (typeof jsonData === 'object' && jsonData !== null) {
      rows = jsonData.questions || jsonData.items || [jsonData];
    }

    if (!Array.isArray(rows)) {
      rows = [rows];
    }

    return await this.processImportRows(rows);
  }

  parseCSVBuffer(buffer) {
    return new Promise((resolve, reject) => {
      const results = [];
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      bufferStream
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }

  async processImportRows(rows) {
    const summary = {
      totalRows: rows.length,
      successful: 0,
      skipped: 0,
      duplicates: 0,
      failed: 0,
      invalid: 0,
      errors: [],
    };

    if (!rows || rows.length === 0) {
      summary.errors.push({ row: 0, message: 'File/JSON is empty or invalid format.' });
      return summary;
    }

    // Cache existing topics for speed
    const topicsList = await Topic.findAll();
    const topicMap = new Map(topicsList.map((t) => [t.name.toLowerCase().trim(), t]));

    // Batch set to track duplicates within the same uploaded file/payload
    const batchSeenSet = new Set();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const rawRow = rows[i];

      // Standardize field keys (handle casing & whitespace in JSON/CSV headers)
      const row = this.normalizeRowKeys(rawRow);

      // 1. Validation
      const validationError = this.validateRow(row);
      if (validationError) {
        summary.invalid++;
        summary.failed++;
        summary.errors.push({
          row: rowNum,
          question: row.question || 'N/A',
          status: 'Failed (Validation Error)',
          message: validationError,
        });
        continue; // Skip invalid row & continue processing next record
      }

      const normalizedQ = normalizePunjabiText(row.question.trim());

      // 2. Check duplicate in current batch
      if (batchSeenSet.has(normalizedQ)) {
        summary.duplicates++;
        summary.skipped++;
        summary.errors.push({
          row: rowNum,
          question: row.question.trim(),
          status: 'Skipped (Duplicate in Batch)',
          message: 'Record repeated in the uploaded batch. Skipped.',
        });
        continue; // Skip duplicate & continue processing next record
      }

      // 3. Check duplicate against Database records
      const dupCheck = await duplicateDetectorService.checkDuplicate(row.question.trim());
      if (dupCheck.isDuplicate) {
        summary.duplicates++;
        summary.skipped++;
        summary.errors.push({
          row: rowNum,
          question: row.question.trim(),
          status: 'Skipped (Already present in Database)',
          message: `Record already present in database: ${dupCheck.reason}. Skipped.`,
        });
        continue; // Skip duplicate & continue processing next record
      }

      // 4. Process Topic & Subtopic
      let topic = topicMap.get(row.topic.toLowerCase().trim());
      if (!topic) {
        topic = await Topic.create({
          name: row.topic.trim(),
          description: `Imported Topic: ${row.topic.trim()}`,
        });
        topicMap.set(row.topic.toLowerCase().trim(), topic);
      }

      let subtopicId = null;
      if (row.subtopic && row.subtopic.trim()) {
        let subtopic = await Subtopic.findOne({
          where: { topic_id: topic.id, name: row.subtopic.trim() },
        });
        if (!subtopic) {
          subtopic = await Subtopic.create({
            topic_id: topic.id,
            name: row.subtopic.trim(),
          });
        }
        subtopicId = subtopic.id;
      }

      // Format Difficulty
      let diff = (row.difficulty || 'medium').toLowerCase().trim();
      if (!['easy', 'medium', 'tough'].includes(diff)) {
        diff = 'medium';
      }

      // Format Correct Option
      const correctOpt = (row.correctOption || row.correct_option || 'A').toUpperCase().trim();

      try {
        await Question.create({
          question: row.question.trim(),
          option_a: row.optionA.trim(),
          option_b: row.optionB.trim(),
          option_c: row.optionC.trim(),
          option_d: row.optionD.trim(),
          correct_option: correctOpt,
          explanation: row.explanation ? row.explanation.trim() : null,
          topic_id: topic.id,
          subtopic_id: subtopicId,
          difficulty: diff,
          language: row.language || 'Punjabi',
          source: row.source ? row.source.trim() : 'JSON/CSV Import',
          source_url: row.sourceUrl || row.source_url || null,
          is_verified: true,
          is_active: true,
          normalized_text: normalizedQ,
        });

        // Add to batch tracking set
        batchSeenSet.add(normalizedQ);

        summary.successful++;
      } catch (err) {
        summary.failed++;
        summary.errors.push({
          row: rowNum,
          question: row.question.trim(),
          status: 'Failed (Database Insert Error)',
          message: err.message,
        });
      }
    }

    return summary;
  }

  normalizeRowKeys(rawRow) {
    if (!rawRow || typeof rawRow !== 'object') return {};
    const normalized = {};
    Object.keys(rawRow).forEach((key) => {
      const cleanKey = key.trim().replace(/^[\uFEFF\xFFFE]/, ''); // remove BOM
      const lowerKey = cleanKey.toLowerCase().replace(/_/g, '');

      if (lowerKey === 'question') normalized.question = rawRow[key];
      else if (lowerKey === 'optiona' || lowerKey === 'option1') normalized.optionA = rawRow[key];
      else if (lowerKey === 'optionb' || lowerKey === 'option2') normalized.optionB = rawRow[key];
      else if (lowerKey === 'optionc' || lowerKey === 'option3') normalized.optionC = rawRow[key];
      else if (lowerKey === 'optiond' || lowerKey === 'option4') normalized.optionD = rawRow[key];
      else if (lowerKey === 'correctoption' || lowerKey === 'answer' || lowerKey === 'correct') normalized.correctOption = rawRow[key];
      else if (lowerKey === 'explanation') normalized.explanation = rawRow[key];
      else if (lowerKey === 'topic') normalized.topic = rawRow[key];
      else if (lowerKey === 'subtopic') normalized.subtopic = rawRow[key];
      else if (lowerKey === 'difficulty') normalized.difficulty = rawRow[key];
      else if (lowerKey === 'source') normalized.source = rawRow[key];
      else if (lowerKey === 'sourceurl') normalized.sourceUrl = rawRow[key];
    });
    return normalized;
  }

  validateRow(row) {
    if (!row.question || !row.question.trim()) return 'Missing question text';
    if (!row.optionA || !row.optionA.trim()) return 'Missing optionA';
    if (!row.optionB || !row.optionB.trim()) return 'Missing optionB';
    if (!row.optionC || !row.optionC.trim()) return 'Missing optionC';
    if (!row.optionD || !row.optionD.trim()) return 'Missing optionD';
    if (!row.correctOption || !row.correctOption.trim()) return 'Missing correctOption';
    const opt = row.correctOption.toUpperCase().trim();
    if (!['A', 'B', 'C', 'D'].includes(opt)) return `Invalid correctOption "${row.correctOption}". Must be A, B, C, or D.`;
    if (!row.topic || !row.topic.trim()) return 'Missing topic';
    return null;
  }
}

module.exports = new QuestionImportService();
