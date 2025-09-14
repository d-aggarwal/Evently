const optimizedEventService = require('../services/optimizedEventService');

class OptimizedEventController {
  // Optimized event listing
  async getOptimizedEvents(req, res) {
    try {
      const filters = {
        search: req.query.search,
        category: req.query.category,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        order: req.query.order
      };

      const startTime = Date.now();
      const result = await optimizedEventService.getOptimizedEventList(filters);
      const queryTime = Date.now() - startTime;

      res.status(200).json({
        message: 'Optimized events retrieved successfully',
        data: result,
        performance: {
          queryTime: `${queryTime}ms`,
          cached: false
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // Optimized event details
  async getOptimizedEventDetails(req, res) {
    try {
      const startTime = Date.now();
      const event = await optimizedEventService.getOptimizedEventDetails(req.params.id);
      const queryTime = Date.now() - startTime;

      res.status(200).json({
        message: 'Optimized event details retrieved successfully',
        data: { event },
        performance: {
          queryTime: `${queryTime}ms`
        }
      });
    } catch (error) {
      res.status(404).json({
        error: error.message
      });
    }
  }

  // Bulk operations for admin
  async bulkUpdateEvents(req, res) {
    try {
      const { eventIds, status } = req.body;
      const result = await optimizedEventService.bulkUpdateEventStatus(eventIds, status);
      
      res.status(200).json({
        message: 'Bulk update completed successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

  // Popular events with performance metrics
  async getPopularEvents(req, res) {
    try {
      const { limit = 10, timeframe = '30d' } = req.query;
      
      const startTime = Date.now();
      const events = await optimizedEventService.getPopularEventsOptimized(limit, timeframe);
      const queryTime = Date.now() - startTime;

      res.status(200).json({
        message: 'Popular events retrieved successfully',
        data: { events },
        performance: {
          queryTime: `${queryTime}ms`,
          optimized: true
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = new OptimizedEventController();
