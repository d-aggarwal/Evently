const eventService = require('../services/eventService');

class EventController {
  // Public: Get all published events
  async getAllEvents(req, res) {
    try {
      const filters = {
        search: req.query.search,
        category: req.query.category,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await eventService.getAllEvents(filters);
      
      res.status(200).json({
        message: 'Events retrieved successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // Public: Get single event
  async getEventById(req, res) {
    try {
      const event = await eventService.getEventById(req.params.id);
      
      res.status(200).json({
        message: 'Event retrieved successfully',
        data: { event }
      });
    } catch (error) {
      res.status(404).json({
        error: error.message
      });
    }
  }

  // Admin: Create event (auto-publish for testing)
  async createEvent(req, res) {
    try {
      // Auto-publish events in development for easier testing
      const eventData = {
        ...req.body,
        status: process.env.NODE_ENV === 'development' ? 'published' : 'draft'
      };
      
      const event = await eventService.createEvent(eventData, req.user.id);
      
      res.status(201).json({
        message: 'Event created successfully',
        data: { event }
      });
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

  // Admin: Update event
  async updateEvent(req, res) {
    try {
      const event = await eventService.updateEvent(req.params.id, req.body, req.user.id);
      
      res.status(200).json({
        message: 'Event updated successfully',
        data: { event }
      });
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

  // Admin: Delete event
  async deleteEvent(req, res) {
    try {
      const result = await eventService.deleteEvent(req.params.id);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

  // Admin: Get all events
  async getAllEventsAdmin(req, res) {
    try {
      const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await eventService.getAllEventsAdmin(filters);
      
      res.status(200).json({
        message: 'Admin events retrieved successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // Admin: Get single event
  async getAdminEventById(req, res) {
    try {
      const event = await eventService.getAdminEventById(req.params.id);
      
      res.status(200).json({
        message: 'Admin event retrieved successfully',
        data: { event }
      });
    } catch (error) {
      res.status(404).json({
        error: error.message
      });
    }
  }
}

module.exports = new EventController();
