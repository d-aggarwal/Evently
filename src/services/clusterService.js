const cluster = require('cluster');
const os = require('os');
const redisClient = require('../config/redis');

class ClusterService {
  constructor() {
    this.redis = redisClient.getClient();
    this.instanceId = process.env.INSTANCE_ID || `${os.hostname()}-${process.pid}`;
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
  }

  // Register instance in Redis
  async registerInstance() {
    const instanceInfo = {
      id: this.instanceId,
      pid: process.pid,
      hostname: os.hostname(),
      port: process.env.PORT || 3000,
      startTime: this.startTime,
      status: 'healthy',
      lastHeartbeat: Date.now(),
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    await this.redis.setex(
      `instance:${this.instanceId}`, 
      60, // TTL 60 seconds
      JSON.stringify(instanceInfo)
    );

    console.log(`Instance ${this.instanceId} registered`);
  }

  // Send periodic heartbeat
  startHeartbeat() {
    setInterval(async () => {
      try {
        await this.registerInstance();
      } catch (error) {
        console.error('Heartbeat failed:', error.message);
      }
    }, parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000);
  }

  // Get all active instances
  async getActiveInstances() {
    const keys = await this.redis.keys('instance:*');
    const instances = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        instances.push(JSON.parse(data));
      }
    }

    return instances;
  }

  // Increment request counter
  incrementRequestCount() {
    this.requestCount++;
  }

  // Increment error counter
  incrementErrorCount() {
    this.errorCount++;
  }

  // Get instance metrics
  getInstanceMetrics() {
    return {
      instanceId: this.instanceId,
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log(`Shutting down instance ${this.instanceId}`);
    await this.redis.del(`instance:${this.instanceId}`);
    process.exit(0);
  }
}

module.exports = new ClusterService();
