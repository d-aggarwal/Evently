const os = require('os');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: []
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        loadAverage: []
      },
      instances: new Map()
    };
    
    this.startSystemMonitoring();
  }

  trackRequest(req, res, next) {
    const startTime = Date.now();
    const instanceId = process.env.INSTANCE_ID || `${os.hostname()}-${process.pid}`;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      this.metrics.requests.total++;
      this.metrics.requests.responseTimes.push(duration);
      
      // Keep only last 1000 response times
      if (this.metrics.requests.responseTimes.length > 1000) {
        this.metrics.requests.responseTimes.shift();
      }
      
      // Update average
      this.metrics.requests.avgResponseTime = 
        this.metrics.requests.responseTimes.reduce((a, b) => a + b, 0) / 
        this.metrics.requests.responseTimes.length;

      if (res.statusCode >= 400) {
        this.metrics.requests.failed++;
      } else {
        this.metrics.requests.successful++;
      }

      // Track per instance
      if (!this.metrics.instances.has(instanceId)) {
        this.metrics.instances.set(instanceId, {
          requests: 0,
          errors: 0,
          avgResponseTime: 0
        });
      }
      
      const instanceMetrics = this.metrics.instances.get(instanceId);
      instanceMetrics.requests++;
      if (res.statusCode >= 400) instanceMetrics.errors++;
    });

    next();
  }

  startSystemMonitoring() {
    setInterval(() => {
      this.metrics.system.cpuUsage = os.loadavg()[0];
      this.metrics.system.memoryUsage = process.memoryUsage();
      this.metrics.system.loadAverage = os.loadavg();
    }, 5000);
  }

  getMetrics() {
    return {
      ...this.metrics,
      instances: Object.fromEntries(this.metrics.instances),
      performance: {
        requestsPerSecond: this.metrics.requests.total / (process.uptime() || 1),
        errorRate: (this.metrics.requests.failed / this.metrics.requests.total * 100) || 0,
        p95ResponseTime: this.calculatePercentile(this.metrics.requests.responseTimes, 95),
        p99ResponseTime: this.calculatePercentile(this.metrics.requests.responseTimes, 99)
      }
    };
  }

  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  resetMetrics() {
    this.metrics.requests = {
      total: 0,
      successful: 0,
      failed: 0,
      avgResponseTime: 0,
      responseTimes: []
    };
    this.metrics.instances.clear();
  }
}

const performanceMonitor = new PerformanceMonitor();

module.exports = {
  trackRequest: (req, res, next) => performanceMonitor.trackRequest(req, res, next),
  getMetrics: () => performanceMonitor.getMetrics(),
  resetMetrics: () => performanceMonitor.resetMetrics()
};
