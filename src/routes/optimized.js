const express = require('express');
const optimizedEventController = require('../controllers/optimizedEventController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Optimized public endpoints
router.get('/events', optimizedEventController.getOptimizedEvents);
router.get('/events/:id', optimizedEventController.getOptimizedEventDetails);
router.get('/popular-events', optimizedEventController.getPopularEvents);

// Optimized admin endpoints
router.post('/admin/events/bulk-update',
  authenticateToken,
  requireAdmin,
  optimizedEventController.bulkUpdateEvents
);

module.exports = router;
