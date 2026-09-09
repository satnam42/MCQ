const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subtopic = sequelize.define('Subtopic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  topic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'subtopics',
});

module.exports = Subtopic;
