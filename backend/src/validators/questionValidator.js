const Joi = require('joi');
const { errorResponse } = require('../utils/responseFormatter');

const questionSchema = Joi.object({
  question: Joi.string().required(),
  optionA: Joi.string().required(),
  optionB: Joi.string().required(),
  optionC: Joi.string().required(),
  optionD: Joi.string().required(),
  correctOption: Joi.string().valid('A', 'B', 'C', 'D').required(),
  explanation: Joi.string().allow('', null),
  topicId: Joi.number().integer().required(),
  subtopicId: Joi.number().integer().allow(null),
  difficulty: Joi.string().valid('easy', 'medium', 'tough').default('medium'),
  language: Joi.string().default('Punjabi'),
  source: Joi.string().allow('', null),
  sourceUrl: Joi.string().uri().allow('', null),
  isVerified: Joi.boolean().default(true),
  isActive: Joi.boolean().default(true),
});

const validateQuestion = (req, res, next) => {
  const { error } = questionSchema.validate(req.body);
  if (error) {
    return errorResponse(res, error.details[0].message, 'VALIDATION_ERROR', 400);
  }
  next();
};

module.exports = {
  validateQuestion,
};
