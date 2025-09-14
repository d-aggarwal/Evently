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

    // Use Upstash URL for both environments
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('UPSTASH_REDIS_URL is required');
    }

    try {
      this.client = new Redis(redisUrl, {
        tls: { rejectUnauthorized: false },
        maxRetriesPerRequest: 5,
        retryStrategy: (times) => Math.min(times * 50, 2000)
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to Upstash Redis');
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis Error:', {
          message: error.message,
          code: error.code
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
