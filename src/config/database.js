const { Sequelize } = require('sequelize');
require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'evently_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    pool: {
      max: 25,
      min: 5,
      acquire: 120000, // Increased timeout
      idle: 30000,    // Increased idle time
      evict: 30000    // Connection eviction time
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    retry: {
      max: 5,        // Increased retries
      timeout: 10000, // Retry timeout
      match: [       // Retry on these errors
        /Deadlock/i,
        /TimeoutError/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    },
    dialectOptions: {
      connectTimeout: 60000,  // Increased connection timeout
      keepAlive: true,       // Enable keepalive
    }
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME_TEST || 'evently_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 1,
      acquire: 10000,
      idle: 5000
    },
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    pool: {
      max: 50,
      min: 10,
      acquire: 120000,
      idle: 30000,
      evict: 30000
    },
    logging: false,
    retry: {
      max: 5,
      timeout: 10000,
      match: [
        /Deadlock/i,
        /TimeoutError/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    },
    dialectOptions: {
      connectTimeout: 60000,
      keepAlive: true,
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env]);

// Add connection error handling
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Export both for Sequelize CLI and application use
module.exports = config;
module.exports.sequelize = sequelize;
module.exports.config = config;
