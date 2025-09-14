const express = require('express');
const bookingController = require('../controllers/bookingController');
const validate = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { bookingValidation } = require('../utils/validation');

const router = express.Router();

// User routes
router.post('/',
  authenticateToken,
  validate(bookingValidation.create),
  bookingController.createBooking
);

router.get('/',
  authenticateToken,
  bookingController.getUserBookings
);

router.get('/:id',
  authenticateToken,
  bookingController.getBookingById
);

router.delete('/:id',
  authenticateToken,
  validate(bookingValidation.cancel),
  bookingController.cancelBooking
);

// Admin routes
router.get('/admin/all',
  authenticateToken,
  requireAdmin,
  bookingController.getAllBookingsAdmin
);

module.exports = router;
