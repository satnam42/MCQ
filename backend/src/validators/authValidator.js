const Joi = require('joi');
const { errorResponse } = require('../utils/responseFormatter');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('candidate', 'admin').default('candidate'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return errorResponse(res, error.details[0].message, 'VALIDATION_ERROR', 400);
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return errorResponse(res, error.details[0].message, 'VALIDATION_ERROR', 400);
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
};
