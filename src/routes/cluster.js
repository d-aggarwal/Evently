const express = require('express');
const clusterController = require('../controllers/clusterController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin routes for cluster management
router.get('/instances',
  authenticateToken,
  requireAdmin,
  clusterController.getActiveInstances
);

router.get('/metrics',
  authenticateToken,
  requireAdmin,
  clusterController.getClusterMetrics
);

module.exports = router;
