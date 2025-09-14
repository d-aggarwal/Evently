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

    if (process.env.NODE_ENV === 'production') {
      // Upstash Redis configuration
      this.client = new Redis(process.env.UPSTASH_REDIS_URL, {
        tls: { rejectUnauthorized: false },
        token: process.env.UPSTASH_REDIS_TOKEN,
        maxRetriesPerRequest: 5,
        retryStrategy: (times) => Math.min(times * 50, 2000)
      });
    } else {
      // Local Redis configuration
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
