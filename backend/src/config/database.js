require('./env');
const { Sequelize } = require('sequelize');
const path = require('path');


const dbName = process.env.DB_NAME || 'punjabi_lecturer_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || 'root';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 3306;
const dialect = process.env.DB_DIALECT || 'sqlite'; // Default to sqlite if mysql service socket not active

let sequelize;

if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: { timestamps: true, underscored: true },
  });
} else if (dialect === 'mysql') {
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? false : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true },
  });
} else {
  // SQLite Fallback for portable container runtime
  const storagePath = process.env.DB_STORAGE || path.join(__dirname, '../../punjabi_lecturer.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
    define: { timestamps: true, underscored: true },
  });
}

module.exports = { sequelize };
