const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserContentView = sequelize.define('UserContentView', {
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
  content_type: {
    type: DataTypes.ENUM('topic', 'question'),
    allowNull: false,
  },
  content_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  viewed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'user_content_views',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'content_type', 'content_id'],
      name: 'unique_user_content_view',
    },
    {
      fields: ['user_id', 'content_type'],
      name: 'idx_user_content_type',
    },
  ],
});

module.exports = UserContentView;
