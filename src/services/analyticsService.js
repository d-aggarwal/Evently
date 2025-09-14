const { Event, Booking, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
  // Dashboard overview - key metrics
  async getDashboardOverview() {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalEvents,
      totalBookings,
      totalRevenue,
      recentBookings,
      activeEvents,
      newUsersThisMonth
    ] = await Promise.all([
      User.count(),
      Event.count(),
      Booking.count({ where: { status: 'confirmed' } }),
      Booking.sum('totalAmount', { where: { status: 'confirmed' } }),
      Booking.count({ 
        where: { 
          status: 'confirmed',
          createdAt: { [Op.gte]: last30Days }
        }
      }),
      Event.count({ 
        where: { 
          status: 'published',
          dateTime: { [Op.gte]: now }
        }
      }),
      User.count({ 
        where: { 
          createdAt: { [Op.gte]: last30Days }
        }
      })
    ]);

    return {
      totalUsers,
      totalEvents,
      totalBookings,
      totalRevenue: parseFloat(totalRevenue || 0),
      recentBookings,
      activeEvents,
      newUsersThisMonth
    };
  }

  // Event-wise analytics
  async getEventAnalytics(filters = {}) {
    const { page = 1, limit = 10, sortBy = 'revenue', order = 'DESC' } = filters;
    const offset = (page - 1) * limit;

    // Use raw query for complex aggregations
    const query = `
      SELECT 
        e.id,
        e.name,
        e.venue,
        e."dateTime",
        e."totalCapacity",
        e."availableCapacity",
        e.price,
        COALESCE(COUNT(b.id), 0) as "totalBookings",
        COALESCE(SUM(b.quantity), 0) as "ticketsSold",
        COALESCE(SUM(b."totalAmount"), 0) as revenue
      FROM events e
      LEFT JOIN bookings b ON e.id = b."eventId" AND b.status = 'confirmed'
      GROUP BY e.id, e.name, e.venue, e."dateTime", e."totalCapacity", e."availableCapacity", e.price
      ORDER BY ${sortBy === 'revenue' ? 'revenue' : sortBy === 'bookings' ? '"totalBookings"' : `e."${sortBy}"`} ${order}
      LIMIT :limit OFFSET :offset
    `;

    const events = await sequelize.query(query, {
      replacements: { limit: parseInt(limit), offset: parseInt(offset) },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate capacity utilization
    const eventsWithMetrics = events.map(event => {
      const ticketsSold = parseInt(event.ticketsSold) || 0;
      const capacityUtilization = ((ticketsSold / event.totalCapacity) * 100).toFixed(2);
      
      return {
        ...event,
        ticketsSold,
        totalBookings: parseInt(event.totalBookings),
        revenue: parseFloat(event.revenue || 0),
        capacityUtilization: parseFloat(capacityUtilization)
      };
    });

    return {
      events: eventsWithMetrics,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  // Revenue analytics over time
  async getRevenueAnalytics(timeframe = '30d') {
    const now = new Date();
    let startDate;
    let groupBy;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '12m':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = 'month';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
    }

    console.log('Debug - Start Date:', startDate);
    console.log('Debug - Now:', now);

    // First, let's check if there are any bookings in the timeframe
    const debugQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        MIN(b."createdAt") as earliest_booking,
        MAX(b."createdAt") as latest_booking
      FROM bookings b
      WHERE b.status = 'confirmed'
    `;

    const debugResult = await sequelize.query(debugQuery, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log('Debug - All bookings:', debugResult[0]);

    // Check bookings in timeframe
    const timeframeQuery = `
      SELECT 
        COUNT(*) as bookings_in_timeframe,
        SUM(b."totalAmount") as total_revenue
      FROM bookings b
      WHERE b.status = 'confirmed' 
        AND b."createdAt" >= :startDate
        AND b."createdAt" <= :endDate
    `;

    const timeframeResult = await sequelize.query(timeframeQuery, {
      replacements: { 
        startDate: startDate.toISOString(), 
        endDate: now.toISOString() 
      },
      type: sequelize.QueryTypes.SELECT
    });

    console.log('Debug - Timeframe bookings:', timeframeResult[0]);

    const dateFormat = groupBy === 'month' ? 
      "TO_CHAR(b.\"createdAt\", 'YYYY-MM')" :
      "TO_CHAR(b.\"createdAt\", 'YYYY-MM-DD')";

    const query = `
      SELECT 
        ${dateFormat} as period,
        SUM(b."totalAmount") as revenue,
        COUNT(b.id) as bookings
      FROM bookings b
      WHERE b.status = 'confirmed' 
        AND b."createdAt" >= :startDate
        AND b."createdAt" <= :endDate
      GROUP BY ${dateFormat}
      ORDER BY period ASC
    `;

    console.log('Debug - Final query:', query);

    const revenueData = await sequelize.query(query, {
      replacements: { 
        startDate: startDate.toISOString(), 
        endDate: now.toISOString() 
      },
      type: sequelize.QueryTypes.SELECT
    });

    console.log('Debug - Revenue data result:', revenueData);

    // Get total stats for comparison
    const totalBookings = await Booking.count({ where: { status: 'confirmed' } });
    const totalRevenue = await Booking.sum('totalAmount', { where: { status: 'confirmed' } });
    
    if (revenueData.length === 0) {
      return {
        analytics: [],
        summary: {
          message: `No bookings found in the last ${timeframe}`,
          totalBookingsAllTime: totalBookings,
          totalRevenueAllTime: parseFloat(totalRevenue || 0),
          period: {
            from: startDate.toISOString().split('T')[0],
            to: now.toISOString().split('T')[0]
          },
          debug: {
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            allBookings: debugResult[0],
            timeframeBookings: timeframeResult[0]
          }
        }
      };
    }

    return {
      analytics: revenueData.map(item => ({
        period: item.period,
        revenue: parseFloat(item.revenue),
        bookings: parseInt(item.bookings)
      })),
      summary: {
        totalRevenue: revenueData.reduce((sum, item) => sum + parseFloat(item.revenue), 0),
        totalBookings: revenueData.reduce((sum, item) => sum + parseInt(item.bookings), 0),
        period: {
          from: startDate.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        }
      }
    };
  }

  // User engagement analytics
  async getUserAnalytics() {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      userRegistrations,
      activeUsers,
      topUsers
    ] = await Promise.all([
      // User registrations over time (last 30 days)
      sequelize.query(`
        SELECT 
          DATE(u."createdAt") as date,
          COUNT(u.id) as registrations
        FROM users u
        WHERE u."createdAt" >= :startDate
        GROUP BY DATE(u."createdAt")
        ORDER BY DATE(u."createdAt") ASC
      `, {
        replacements: { startDate: last30Days },
        type: sequelize.QueryTypes.SELECT
      }),

      // Active users (users with bookings in last 30 days)
      sequelize.query(`
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        INNER JOIN bookings b ON u.id = b."userId"
        WHERE b."createdAt" >= :startDate AND b.status = 'confirmed'
      `, {
        replacements: { startDate: last30Days },
        type: sequelize.QueryTypes.SELECT
      }),

      // Top users by bookings
      sequelize.query(`
        SELECT 
          u.id,
          u."firstName",
          u."lastName",
          u.email,
          COUNT(b.id) as "totalBookings",
          SUM(b."totalAmount") as "totalSpent"
        FROM users u
        INNER JOIN bookings b ON u.id = b."userId"
        WHERE b.status = 'confirmed'
        GROUP BY u.id, u."firstName", u."lastName", u.email
        ORDER BY COUNT(b.id) DESC
        LIMIT 10
      `, {
        type: sequelize.QueryTypes.SELECT
      })
    ]);

    return {
      userRegistrations: userRegistrations.map(item => ({
        date: item.date,
        registrations: parseInt(item.registrations)
      })),
      activeUsers: parseInt(activeUsers[0].count),
      topUsers: topUsers.map(user => ({
        ...user,
        totalBookings: parseInt(user.totalBookings),
        totalSpent: parseFloat(user.totalSpent)
      }))
    };
  }

  // Popular events ranking
  async getPopularEvents(limit = 10) {
    const query = `
      SELECT 
        e.id,
        e.name,
        e.venue,
        e."dateTime",
        e."totalCapacity",
        e."availableCapacity",
        COUNT(b.id) as "totalBookings",
        SUM(b.quantity) as "ticketsSold"
      FROM events e
      INNER JOIN bookings b ON e.id = b."eventId"
      WHERE b.status = 'confirmed'
      GROUP BY e.id, e.name, e.venue, e."dateTime", e."totalCapacity", e."availableCapacity"
      ORDER BY SUM(b.quantity) DESC
      LIMIT :limit
    `;

    const events = await sequelize.query(query, {
      replacements: { limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT
    });

    return events.map(event => {
      const ticketsSold = parseInt(event.ticketsSold) || 0;
      const capacity = event.totalCapacity;
      const utilizationRate = ((ticketsSold / capacity) * 100).toFixed(2);

      return {
        ...event,
        totalBookings: parseInt(event.totalBookings),
        ticketsSold,
        utilizationRate: parseFloat(utilizationRate)
      };
    });
  }
}

module.exports = new AnalyticsService();