const { Event, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class EventService {
  // Get all published events for users
  async getAllEvents(filters = {}) {
    try {
      const { search, category, page = 1, limit = 10 } = filters;
      const offset = (page - 1) * limit;

      console.log('🔍 Fetching events with filters:', filters);

      const whereClause = {
        status: 'published',  // Only published events
        dateTime: {
          [Op.gte]: new Date()  // Future events only
        }
      };

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (category) {
        whereClause.category = category;
      }

      const { count, rows } = await Event.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['dateTime', 'ASC']],
        attributes: ['id', 'name', 'description', 'venue', 'dateTime', 
                    'totalCapacity', 'availableCapacity', 'price', 'category', 'status']
      });

      console.log(`📊 Found ${count} events`);

      return {
        events: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalEvents: count
        }
      };
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  }

  // Get single event details
  async getEventById(eventId) {
    try {
      const event = await Event.findOne({
        where: { 
          id: eventId,
          status: 'published',
          dateTime: { [Op.gte]: new Date() }
        },
        include: [{
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName']
        }],
        lock: true // Add pessimistic locking
      });

      if (!event) {
        throw new Error('Event not found');
      }

      return event;
    } catch (error) {
      console.error('Error fetching event:', {
        eventId,
        errorMessage: error.message
      });
      throw error;
    }
  }

  // Admin: Create new event
  async createEvent(eventData, userId) {
    try {
      // Always set status to published for now (remove environment check)
      const event = await Event.create({
        ...eventData,
        status: 'published',  // Force published status
        createdBy: userId,
        availableCapacity: eventData.totalCapacity
      });

      console.log(`✅ Event created: ${event.id}, Status: ${event.status}`);
      return event;
    } catch (error) {
      console.error('❌ Event creation failed:', error);
      throw error;
    }
  }

  // Admin: Update event
  async updateEvent(eventId, updateData, adminId) {
    const event = await Event.findByPk(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Update available capacity if total capacity changes
    if (updateData.totalCapacity && updateData.totalCapacity !== event.totalCapacity) {
      const bookedTickets = event.totalCapacity - event.availableCapacity;
      updateData.availableCapacity = updateData.totalCapacity - bookedTickets;
      
      if (updateData.availableCapacity < 0) {
        throw new Error('Cannot reduce capacity below current bookings');
      }
    }

    await event.update(updateData);
    return await this.getAdminEventById(eventId);
  }

  // Admin: Delete event
  async deleteEvent(eventId) {
    const event = await Event.findByPk(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.totalCapacity !== event.availableCapacity) {
      throw new Error('Cannot delete event with existing bookings');
    }

    await event.destroy();
    return { message: 'Event deleted successfully' };
  }

  // Admin: Get all events (including drafts)
  async getAllEventsAdmin(filters = {}) {
    const { status, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Event.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      events: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalEvents: count
      }
    };
  }

  // Admin: Get single event (including drafts)
  async getAdminEventById(eventId) {
    const event = await Event.findByPk(eventId, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  // Add new method for handling bookings with proper transaction
  async bookEvent(eventId, userId, tickets) {
    let transaction;
    try {
      transaction = await sequelize.transaction({
        isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
      });

      const event = await Event.findByPk(eventId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.availableCapacity < tickets) {
        throw new Error('Not enough tickets available');
      }

      // Update available capacity
      await event.update({
        availableCapacity: event.availableCapacity - tickets
      }, { transaction });

      await transaction.commit();
      return event;

    } catch (error) {
      if (transaction) await transaction.rollback();
      
      console.error('Booking error:', {
        eventId,
        userId,
        tickets,
        errorMessage: error.message,
        stack: error.stack
      });

      if (error.name === 'SequelizeConnectionError') {
        throw new Error('Database connection error, please try again');
      }
      
      throw error;
    }
  }
}

module.exports = new EventService();
