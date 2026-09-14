const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserAnsweredQuestion = sequelize.define(
  'UserAnsweredQuestion',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    topic_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'topics',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    answered_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'user_answered_questions',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'question_id'],
        name: 'unique_user_question',
      },
    ],
  }
);

module.exports = UserAnsweredQuestion;
