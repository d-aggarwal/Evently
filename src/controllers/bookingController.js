const bookingService = require('../services/bookingService');

class BookingController {
  // Create new booking
  async createBooking(req, res) {
    try {
      const { eventId, quantity } = req.body;
      const result = await bookingService.createBooking(req.user.id, eventId, quantity);
      
      if (result.type === 'success') {
        res.status(201).json({
          message: result.message,
          data: { booking: result.booking }
        });
      } else if (result.type === 'partial') {
        res.status(201).json({
          message: result.message,
          data: { 
            booking: result.booking,
            waitlistEntry: result.waitlistEntry
          }
        });
      } else if (result.type === 'waitlist') {
        res.status(200).json({
          message: result.message,
          data: { waitlistEntry: result.waitlistEntry }
        });
      }
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

  // Cancel booking
  async cancelBooking(req, res) {
    try {
      const { reason } = req.body;
      const booking = await bookingService.cancelBooking(req.params.id, req.user.id, reason);
      
      res.status(200).json({
        message: 'Booking cancelled successfully',
        data: { booking }
      });
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

  // Get user's bookings
  async getUserBookings(req, res) {
    try {
      const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await bookingService.getUserBookings(req.user.id, filters);
      
      res.status(200).json({
        message: 'Bookings retrieved successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

  // Get single booking
  async getBookingById(req, res) {
    try {
      const booking = await bookingService.getBookingById(req.params.id, req.user.id);
      
      res.status(200).json({
        message: 'Booking retrieved successfully',
        data: { booking }
      });
    } catch (error) {
      res.status(404).json({
        error: error.message
      });
    }
  }

  // Admin: Get all bookings
  async getAllBookingsAdmin(req, res) {
    try {
      const filters = {
        eventId: req.query.eventId,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await bookingService.getAllBookingsAdmin(filters);
      
      res.status(200).json({
        message: 'Admin bookings retrieved successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = new BookingController();
