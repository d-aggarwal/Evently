const { Event, User } = require('../models');
const { Op } = require('sequelize');

class EventService {
  // Get all published events for users
  async getAllEvents(filters = {}) {
    const { search, category, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const whereClause = {
      status: 'published',
      dateTime: { [Op.gte]: new Date() }
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { venue: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const { count, rows } = await Event.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['firstName', 'lastName']
      }],
      order: [['dateTime', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      events: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalEvents: count,
        hasNextPage: page < Math.ceil(count / limit)
      }
    };
  }

  // Get single event details
  async getEventById(eventId) {
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
      }]
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  // Admin: Create new event
  async createEvent(eventData, adminId) {
    const event = await Event.create({
      ...eventData,
      availableCapacity: eventData.totalCapacity,
      createdBy: adminId,
      status: eventData.status || 'draft' // Use provided status or default to draft
    });

    return await this.getAdminEventById(event.id);
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
}

module.exports = new EventService();
