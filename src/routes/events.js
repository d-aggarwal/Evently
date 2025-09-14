const express = require('express');
const eventController = require('../controllers/eventController');
const validate = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { eventValidation } = require('../utils/validation');

const router = express.Router();

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// Admin routes
router.post('/',
  authenticateToken,
  requireAdmin,
  validate(eventValidation.create),
  eventController.createEvent
);

router.put('/:id',
  authenticateToken,
  requireAdmin,
  validate(eventValidation.update),
  eventController.updateEvent
);

router.delete('/:id',
  authenticateToken,
  requireAdmin,
  eventController.deleteEvent
);

router.get('/admin/all',
  authenticateToken,
  requireAdmin,
  eventController.getAllEventsAdmin
);

router.get('/admin/:id',
  authenticateToken,
  requireAdmin,
  eventController.getAdminEventById
);

module.exports = router;
