const Redis = require('ioredis');
require('dotenv').config();

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  getClient() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    const redisUrl = process.env.UPSTASH_REDIS_URL;
    
    if (!redisUrl || redisUrl.includes('YOUR_')) {
      console.warn('⚠️ Redis not configured properly, using fallback mode');
      return this.createMockClient();
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,  // Reduce to 1 retry only
        retryStrategy: () => null,  // Don't retry on failure
        connectTimeout: 5000,
        tls: { rejectUnauthorized: false },
        enableReadyCheck: false
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.warn('⚠️ Redis connection failed, using fallback');
        this.isConnected = false;
        return this.createMockClient();
      });

    } catch (error) {
      console.warn('⚠️ Redis setup failed, using fallback');
      return this.createMockClient();
    }

    return this.client || this.createMockClient();
  }

  // Mock Redis client for fallback
  createMockClient() {
    return {
      set: () => Promise.resolve('OK'),
      get: () => Promise.resolve(null),
      del: () => Promise.resolve(1),
      keys: () => Promise.resolve([]),
      eval: () => Promise.resolve(1),
      ping: () => Promise.resolve('PONG')
    };
  }
}

module.exports = new RedisClient();
