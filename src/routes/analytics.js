const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All analytics routes require admin access
router.use(authenticateToken, requireAdmin);

router.get('/overview', analyticsController.getDashboardOverview);
router.get('/events', analyticsController.getEventAnalytics);
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/users', analyticsController.getUserAnalytics);
router.get('/popular-events', analyticsController.getPopularEvents);

module.exports = router;
