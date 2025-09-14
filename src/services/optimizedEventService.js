const { Event, User, Booking, sequelize } = require('../models');
const { Op } = require('sequelize');

class OptimizedEventService {
  // Optimized event listing with strategic queries
  async getOptimizedEventList(filters = {}) {
    const { 
      search, 
      category, 
      page = 1, 
      limit = 10,
      sortBy = 'dateTime',
      order = 'ASC'
    } = filters;

    const offset = (page - 1) * limit;

    // Build optimized where clause
    const whereClause = {
      status: 'published',
      dateTime: { [Op.gte]: new Date() },
      availableCapacity: { [Op.gt]: 0 }
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

    // Use optimized query with selective fields
    const { count, rows } = await Event.findAndCountAll({
      attributes: [
        'id', 'name', 'venue', 'dateTime', 
        'totalCapacity', 'availableCapacity', 'price', 'category'
      ],
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['firstName', 'lastName']
      }],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      subQuery: false // Optimize joins
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

  // Optimized event details with related data
  async getOptimizedEventDetails(eventId) {
    const event = await Event.findOne({
      where: { 
        id: eventId,
        status: 'published'
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName']
        },
        {
          model: Booking,
          as: 'bookings',
          attributes: [],
          where: { status: 'confirmed' },
          required: false
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('bookings.id')), 'totalBookings'],
          [sequelize.fn('SUM', sequelize.col('bookings.quantity')), 'ticketsSold']
        ]
      },
      group: ['Event.id', 'creator.id']
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const eventData = event.toJSON();
    eventData.ticketsSold = parseInt(eventData.ticketsSold) || 0;
    eventData.totalBookings = parseInt(eventData.totalBookings) || 0;
    eventData.capacityUtilization = ((eventData.ticketsSold / event.totalCapacity) * 100).toFixed(2);

    return eventData;
  }

  // Bulk event operations for admin
  async bulkUpdateEventStatus(eventIds, status) {
    const updatedCount = await Event.update(
      { status },
      {
        where: {
          id: { [Op.in]: eventIds }
        }
      }
    );

    return {
      message: `Updated ${updatedCount[0]} events`,
      updatedCount: updatedCount[0]
    };
  }

  // Get popular events with optimized aggregation
  async getPopularEventsOptimized(limit = 10, timeframe = '30d') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    const popularEvents = await sequelize.query(`
      SELECT 
        e.id,
        e.name,
        e.venue,
        e.date_time,
        e.total_capacity,
        e.available_capacity,
        COUNT(b.id) as booking_count,
        SUM(b.quantity) as tickets_sold,
        SUM(b.total_amount) as revenue
      FROM events e
      INNER JOIN bookings b ON e.id = b.event_id
      WHERE b.status = 'confirmed' 
        AND b.created_at >= :startDate
        AND e.status = 'published'
      GROUP BY e.id, e.name, e.venue, e.date_time, e.total_capacity, e.available_capacity
      ORDER BY tickets_sold DESC, revenue DESC
      LIMIT :limit
    `, {
      replacements: { startDate, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT
    });

    return popularEvents.map(event => ({
      ...event,
      bookingCount: parseInt(event.booking_count),
      ticketsSold: parseInt(event.tickets_sold),
      revenue: parseFloat(event.revenue),
      utilizationRate: ((parseInt(event.tickets_sold) / event.total_capacity) * 100).toFixed(2)
    }));
  }
}

module.exports = new OptimizedEventService();
