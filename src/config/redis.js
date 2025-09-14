const Redis = require('ioredis');
require('dotenv').config();

class RedisClient {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (this.client) {
      return this.client;
    }

    // Force TCP connection
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 5,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    };

    console.log('Connecting to Redis at:', `${redisConfig.host}:${redisConfig.port}`);

    try {
      this.client = new Redis(redisConfig);
      
      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis Error:', {
          message: error.message,
          code: error.code,
          syscall: error.syscall,
          address: error.address
        });
      });

    } catch (error) {
      console.error('❌ Redis Connection Error:', error);
      throw error;
    }

    return this.client;
  }
}

module.exports = new RedisClient();
