const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  option_a: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  option_b: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  option_c: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  option_d: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  correct_option: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: false,
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  topic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subtopic_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'tough'),
    allowNull: false,
    defaultValue: 'medium',
  },
  language: {
    type: DataTypes.STRING(20),
    defaultValue: 'Punjabi',
  },
  source: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  source_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  normalized_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'questions',
});

module.exports = Question;
