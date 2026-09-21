const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtConfig = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 'MISSING_FIELDS', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    const existingUser = await User.findOne({ where: { email: cleanEmail } });
    if (existingUser) {
      return errorResponse(res, 'Email is already registered. Please sign in.', 'EMAIL_EXISTS', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(cleanPassword, salt);

    const user = await User.create({
      name: name ? name.trim() : 'Candidate User',
      email: cleanEmail,
      password_hash,
      role: role || 'candidate',
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      'User registered successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 'MISSING_FIELDS', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    const user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) {
      return errorResponse(res, 'Invalid email or password. Please check your credentials.', 'INVALID_CREDENTIALS', 401);
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password. Please check your credentials.', 'INVALID_CREDENTIALS', 401);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'created_at'],
    });
    if (!user) {
      return errorResponse(res, 'User not found', 'USER_NOT_FOUND', 404);
    }
    return successResponse(res, { user });
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      order: [['id', 'DESC']],
    });
    return successResponse(res, { users });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
};

