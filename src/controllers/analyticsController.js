const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  // Dashboard overview
  async getDashboardOverview(req, res) {
    try {
      const overview = await analyticsService.getDashboardOverview();
      
      res.status(200).json({
        message: 'Dashboard overview retrieved successfully',
        data: overview
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // Event analytics
  async getEventAnalytics(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        order: req.query.order
      };

      const analytics = await analyticsService.getEventAnalytics(filters);
      
      res.status(200).json({
        message: 'Event analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // Revenue analytics
  async getRevenueAnalytics(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      const analytics = await analyticsService.getRevenueAnalytics(timeframe);
      
      res.status(200).json({
        message: 'Revenue analytics retrieved successfully',
        data: { 
          timeframe,
          analytics 
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // User analytics
  async getUserAnalytics(req, res) {
    try {
      const analytics = await analyticsService.getUserAnalytics();
      
      res.status(200).json({
        message: 'User analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // Popular events
  async getPopularEvents(req, res) {
    try {
      const { limit = 10 } = req.query;
      const events = await analyticsService.getPopularEvents(limit);
      
      res.status(200).json({
        message: 'Popular events retrieved successfully',
        data: { events }
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();
