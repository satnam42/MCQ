const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TestAttempt = sequelize.define('TestAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  daily_quiz_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  test_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'daily',
    allowNull: false,
  },
  topic_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'tough'),
    allowNull: true,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_questions: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  correct_answers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  incorrect_answers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  unanswered: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  time_taken_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'test_attempts',
});

module.exports = TestAttempt;
