const waitlistService = require('../services/waitlistService');

class WaitlistController {
  // Add user to waitlist
  async addToWaitlist(req, res) {
    try {
      const { eventId, quantity } = req.body;
      const waitlistEntry = await waitlistService.addToWaitlist(req.user.id, eventId, quantity);
      
      res.status(201).json({
        message: 'Added to waitlist successfully',
        data: { waitlistEntry }
      });
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

  // Get user's waitlist position
  async getWaitlistPosition(req, res) {
    try {
      const { eventId } = req.params;
      const position = await waitlistService.getWaitlistPosition(req.user.id, eventId);
      
      res.status(200).json({
        message: 'Waitlist position retrieved successfully',
        data: position
      });
    } catch (error) {
      res.status(404).json({
        error: error.message
      });
    }
  }

  // Remove from waitlist
  async removeFromWaitlist(req, res) {
    try {
      const { eventId } = req.params;
      const result = await waitlistService.removeFromWaitlist(req.user.id, eventId);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

  // Get user's all waitlists
  async getUserWaitlists(req, res) {
    try {
      const waitlists = await waitlistService.getUserWaitlists(req.user.id);
      
      res.status(200).json({
        message: 'User waitlists retrieved successfully',
        data: { waitlists }
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // Admin: Get event waitlist
  async getEventWaitlist(req, res) {
    try {
      const { eventId } = req.params;
      const filters = {
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await waitlistService.getEventWaitlist(eventId, filters);
      
      res.status(200).json({
        message: 'Event waitlist retrieved successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = new WaitlistController();
