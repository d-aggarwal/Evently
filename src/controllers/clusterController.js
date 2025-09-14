const clusterService = require('../services/clusterService');

class ClusterController {
  // Get all active instances
  async getActiveInstances(req, res) {
    try {
      const instances = await clusterService.getActiveInstances();
      
      res.status(200).json({
        message: 'Active instances retrieved successfully',
        data: {
          totalInstances: instances.length,
          instances: instances.map(instance => ({
            id: instance.id,
            hostname: instance.hostname,
            port: instance.port,
            status: instance.status,
            uptime: Date.now() - instance.startTime,
            requestCount: instance.requestCount,
            errorCount: instance.errorCount,
            lastHeartbeat: instance.lastHeartbeat
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // Get cluster metrics
  async getClusterMetrics(req, res) {
    try {
      const instances = await clusterService.getActiveInstances();
      
      const metrics = {
        totalInstances: instances.length,
        totalRequests: instances.reduce((sum, i) => sum + (i.requestCount || 0), 0),
        totalErrors: instances.reduce((sum, i) => sum + (i.errorCount || 0), 0),
        averageUptime: instances.reduce((sum, i) => sum + (Date.now() - i.startTime), 0) / instances.length,
        healthyInstances: instances.filter(i => i.status === 'healthy').length,
        instanceDetails: instances.map(instance => ({
          id: instance.id,
          status: instance.status,
          memoryUsage: instance.memoryUsage,
          requestsPerSecond: instance.requestCount / ((Date.now() - instance.startTime) / 1000),
          errorRate: (instance.errorCount / instance.requestCount * 100) || 0
        }))
      };
      
      res.status(200).json({
        message: 'Cluster metrics retrieved successfully',
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = new ClusterController();
