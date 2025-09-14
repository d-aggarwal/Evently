const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      
      res.status(201).json({
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.status(200).json({
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        error: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await authService.getUserById(req.user.id);
      
      res.status(200).json({
        message: 'Profile retrieved successfully',
        data: { user }
      });
    } catch (error) {
      res.status(404).json({
        error: error.message
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const token = authService.generateToken(req.user.id);
      
      res.status(200).json({
        message: 'Token refreshed successfully',
        data: { token }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to refresh token'
      });
    }
  }

  async createAdmin(req, res) {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          error: 'Admin creation only allowed in development environment'
        });
      }

      // Create admin user with role override
      const adminData = { ...req.body };
      const result = await authService.register(adminData, 'admin');
      
      res.status(201).json({
        message: 'Admin user created successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
