const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserTestLimit = sequelize.define('UserTestLimit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  test_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  override_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'DEFAULT',
  },
  period: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  custom_max_attempts: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'user_test_limits',
});

module.exports = UserTestLimit;
