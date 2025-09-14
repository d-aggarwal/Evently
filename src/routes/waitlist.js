const express = require('express');
const waitlistController = require('../controllers/waitlistController');
const validate = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { bookingValidation } = require('../utils/validation');

const router = express.Router();

// User routes
router.post('/',
  authenticateToken,
  validate(bookingValidation.create), // Reuse booking validation
  waitlistController.addToWaitlist
);

router.get('/',
  authenticateToken,
  waitlistController.getUserWaitlists
);

router.get('/position/:eventId',
  authenticateToken,
  waitlistController.getWaitlistPosition
);

router.delete('/:eventId',
  authenticateToken,
  waitlistController.removeFromWaitlist
);

// Admin routes
router.get('/admin/:eventId',
  authenticateToken,
  requireAdmin,
  waitlistController.getEventWaitlist
);

module.exports = router;
