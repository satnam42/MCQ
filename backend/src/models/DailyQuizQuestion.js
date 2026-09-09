const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyQuizQuestion = sequelize.define('DailyQuizQuestion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  daily_quiz_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  question_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'daily_quiz_questions',
});

module.exports = DailyQuizQuestion;
