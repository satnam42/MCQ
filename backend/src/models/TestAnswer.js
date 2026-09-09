const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TestAnswer = sequelize.define('TestAnswer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  attempt_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  selected_option: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: true,
  },
  correct_option: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: false,
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'test_answers',
});

module.exports = TestAnswer;
