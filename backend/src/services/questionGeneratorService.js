const { Question, Topic, Subtopic } = require('../models');
const { Op } = require('sequelize');

/**
 * Strategy interface for Question Generator
 */
class BaseQuestionGeneratorStrategy {
  async generateQuestions(params) {
    throw new Error('generateQuestions must be implemented by strategy');
  }
}

/**
 * Local Database Strategy (Active MVP Strategy)
 */
class LocalQuestionGeneratorStrategy extends BaseQuestionGeneratorStrategy {
  async generateQuestions({ topicId, difficulty, limit = 10, language = 'Punjabi' }) {
    const where = { is_active: true };

    if (topicId) where.topic_id = topicId;
    if (difficulty) where.difficulty = difficulty;

    const questions = await Question.findAll({
      where,
      limit: parseInt(limit, 10),
      include: [
        { model: Topic, as: 'topic', attributes: ['id', 'name'] },
        { model: Subtopic, as: 'subtopic', attributes: ['id', 'name'] },
      ],
      order: sequelize.random(),
    });

    return questions.map((q) => ({
      id: q.id,
      question: q.question,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      correctOption: q.correct_option,
      explanation: q.explanation,
      topic: q.topic ? q.topic.name : '',
      subtopic: q.subtopic ? q.subtopic.name : '',
      difficulty: q.difficulty,
      source: q.source || 'Local Database',
    }));
  }
}

/**
 * OpenAI Strategy Stub (Future Expansion)
 */
class OpenAIQuestionGeneratorStrategy extends BaseQuestionGeneratorStrategy {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  async generateQuestions({ topicName, difficulty, count = 10, language = 'Punjabi' }) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in .env');
    }
    // Future OpenAI GPT-4/GPT-3.5 API call implementation
    // Prompts Punjabi Lecturer Cadre MCQs in JSON format with strict validation before publishing.
    return [
      {
        question: `[AI Generated Stub] ਪੰਜਾਬੀ ${topicName || 'ਸਾਹਿਤ'} ਨਾਲ ਸੰਬੰਧਿਤ ਪ੍ਰਸ਼ਨ`,
        optionA: 'ਉੱਤਰ ਏ',
        optionB: 'ਉੱਤਰ ਬੀ',
        optionC: 'ਉੱਤਰ ਸੀ',
        optionD: 'ਉੱਤਰ ਡੀ',
        correctOption: 'A',
        explanation: 'ਇਹ AI ਦੁਆਰਾ ਤਿਆਰ ਕੀਤਾ ਸੈਂਪਲ ਪ੍ਰਸ਼ਨ ਹੈ।',
        topic: topicName || 'Punjabi Literature',
        difficulty: difficulty || 'medium',
        source: 'OpenAI Generator (Draft)',
      },
    ];
  }
}

class QuestionGeneratorService {
  constructor() {
    this.strategies = {
      local: new LocalQuestionGeneratorStrategy(),
      openai: new OpenAIQuestionGeneratorStrategy(),
    };
    this.activeStrategy = 'local';
  }

  setStrategy(strategyName) {
    if (!this.strategies[strategyName]) {
      throw new Error(`Unknown generator strategy: ${strategyName}`);
    }
    this.activeStrategy = strategyName;
  }

  async generate(params, strategyName = null) {
    const strategy = this.strategies[strategyName || this.activeStrategy];
    return await strategy.generateQuestions(params);
  }
}

module.exports = new QuestionGeneratorService();
