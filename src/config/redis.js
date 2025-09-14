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

    // Production configuration (Render)
    if (process.env.NODE_ENV === 'production') {
      this.client = new Redis(process.env.REDIS_URL, {
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        maxRetriesPerRequest: 5,
        enableReadyCheck: true
      });
    } else {
      // Development configuration
      this.client = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 5
      });
    }

    this.client.on('error', (error) => {
      console.error('Redis Error:', error);
    });

    this.client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    return this.client;
  }
}

module.exports = new RedisClient();
