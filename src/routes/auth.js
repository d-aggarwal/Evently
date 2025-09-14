const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { authValidation } = require('../utils/validation');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', 
  authLimiter,
  validate(authValidation.register),
  authController.register
);

router.post('/login',
  authLimiter,
  validate(authValidation.login),
  authController.login
);

// Development only - Create admin user
router.post('/create-admin',
  authLimiter,
  validate(authValidation.createAdmin),  // Update this line
  authController.createAdmin
);

// Protected routes
router.get('/profile',
  authenticateToken,
  authController.getProfile
);

router.post('/refresh',
  authenticateToken,
  authController.refreshToken
);

module.exports = router;
