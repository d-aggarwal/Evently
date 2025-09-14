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
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
      idle: 10000,
      evict: 1000
    },
    logging: process.env.DB_ENABLE_LOGGING === 'true' ? console.log : false,
    dialectOptions: {
      statement_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
      idle_in_transaction_session_timeout: 10000
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
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_QUERY_TIMEOUT) || 60000,
      idle: 10000
    },
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

const env = process.env.NODE_ENV || 'development';

// Optimized sequelize instance with query optimization
const sequelize = new Sequelize(config[env]);

// Add query hooks for performance monitoring
sequelize.addHook('beforeFind', (options) => {
  options.benchmark = true;
  options.logging = (sql, timing) => {
    if (timing > 1000) { // Log slow queries
      console.warn(`SLOW QUERY (${timing}ms): ${sql}`);
    }
  };
});

// Export for both CLI and application use
module.exports = config;
module.exports.sequelize = sequelize;
module.exports.config = config;
