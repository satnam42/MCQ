const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyQuiz = sequelize.define('DailyQuiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quiz_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
  },
  total_questions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
  },
  easy_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
  },
  medium_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
  },
  tough_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
  },
}, {
  tableName: 'daily_quizzes',
});

module.exports = DailyQuiz;
