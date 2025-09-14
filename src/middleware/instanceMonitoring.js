const clusterService = require('../services/clusterService');

// Request monitoring middleware
const requestMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  // Increment request count
  clusterService.incrementRequestCount();
  
  // Add instance info to response headers
  res.setHeader('X-Instance-ID', clusterService.instanceId);
  res.setHeader('X-Process-ID', process.pid);
  
  // Monitor response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`SLOW REQUEST (${duration}ms): ${req.method} ${req.path}`);
    }
    
    // Track errors
    if (res.statusCode >= 400) {
      clusterService.incrementErrorCount();
    }
  });
  
  next();
};

// Health check middleware
const healthCheck = (req, res, next) => {
  if (req.path === '/api/health/instance') {
    const metrics = clusterService.getInstanceMetrics();
    const memoryUsage = process.memoryUsage();
    
    const health = {
      status: 'healthy',
      instance: metrics,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      timestamp: new Date().toISOString()
    };
    
    // Mark as unhealthy if memory usage is too high
    if (memoryUsage.heapUsed > 400 * 1024 * 1024) { // 400MB
      health.status = 'warning';
    }
    
    return res.status(200).json(health);
  }
  
  next();
};

module.exports = {
  requestMonitoring,
  healthCheck
};
