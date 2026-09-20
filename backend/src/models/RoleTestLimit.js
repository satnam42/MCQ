const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoleTestLimit = sequelize.define('RoleTestLimit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  test_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  period: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Daily',
  },
  max_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
  },
}, {
  tableName: 'role_test_limits',
});

module.exports = RoleTestLimit;
