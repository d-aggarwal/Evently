const { Waitlist, Event, User, sequelize } = require('../models');
const { notificationQueue } = require('../config/queue');

class WaitlistService {
  // Add user to waitlist
  async addToWaitlist(userId, eventId, quantity) {
    return await sequelize.transaction(async (transaction) => {
      // Check if user is already on waitlist
      const existingWaitlist = await Waitlist.findOne({
        where: { userId, eventId },
        transaction
      });

      if (existingWaitlist) {
        throw new Error('You are already on the waitlist for this event');
      }

      // Get next position
      const maxPosition = await Waitlist.max('position', {
        where: { eventId, status: 'active' },
        transaction
      });

      const position = (maxPosition || 0) + 1;

      // Create waitlist entry
      const waitlistEntry = await Waitlist.create({
        userId,
        eventId,
        quantity,
        position,
        status: 'active'
      }, { transaction });

      return await this.getWaitlistEntryById(waitlistEntry.id);
    });
  }

  // Get user's waitlist position
  async getWaitlistPosition(userId, eventId) {
    const waitlistEntry = await Waitlist.findOne({
      where: { userId, eventId, status: 'active' },
      include: [{
        model: Event,
        as: 'event',
        attributes: ['name', 'dateTime']
      }]
    });

    if (!waitlistEntry) {
      throw new Error('Not on waitlist for this event');
    }

    // Count people ahead in line
    const peopleAhead = await Waitlist.count({
      where: {
        eventId,
        status: 'active',
        position: { [sequelize.Op.lt]: waitlistEntry.position }
      }
    });

    return {
      ...waitlistEntry.toJSON(),
      peopleAhead
    };
  }

  // Process waitlist when tickets become available
  async processWaitlistOnCancellation(eventId, availableQuantity) {
    const waitlistEntries = await Waitlist.findAll({
      where: {
        eventId,
        status: 'active'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName']
      }],
      order: [['position', 'ASC']]
    });

    const notifications = [];
    let remainingCapacity = availableQuantity;

    for (const entry of waitlistEntries) {
      if (remainingCapacity <= 0) break;

      if (entry.quantity <= remainingCapacity) {
        // Notify user about available tickets
        await notificationQueue.add('send-waitlist-notification', {
          userId: entry.userId,
          eventId: entry.eventId,
          availableTickets: entry.quantity
        });

        // Update waitlist entry
        await entry.update({
          status: 'notified',
          notifiedAt: new Date()
        });

        notifications.push({
          userId: entry.userId,
          email: entry.user.email,
          quantity: entry.quantity
        });

        remainingCapacity -= entry.quantity;
      }
    }

    return {
      notified: notifications.length,
      notifications
    };
  }

  // Remove from waitlist
  async removeFromWaitlist(userId, eventId) {
    const waitlistEntry = await Waitlist.findOne({
      where: { userId, eventId, status: 'active' }
    });

    if (!waitlistEntry) {
      throw new Error('Not on waitlist for this event');
    }

    await waitlistEntry.destroy();

    // Reorder positions for remaining entries
    await this.reorderWaitlistPositions(eventId, waitlistEntry.position);

    return { message: 'Removed from waitlist successfully' };
  }

  // Reorder positions after removal
  async reorderWaitlistPositions(eventId, removedPosition) {
    await Waitlist.update(
      { position: sequelize.literal('position - 1') },
      {
        where: {
          eventId,
          status: 'active',
          position: { [sequelize.Op.gt]: removedPosition }
        }
      }
    );
  }

  // Get waitlist entry by ID
  async getWaitlistEntryById(waitlistId) {
    return await Waitlist.findByPk(waitlistId, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['name', 'venue', 'dateTime']
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });
  }

  // Get user's all waitlist entries
  async getUserWaitlists(userId) {
    return await Waitlist.findAll({
      where: { userId, status: 'active' },
      include: [{
        model: Event,
        as: 'event',
        attributes: ['id', 'name', 'venue', 'dateTime', 'availableCapacity']
      }],
      order: [['createdAt', 'DESC']]
    });
  }

  // Admin: Get event waitlist
  async getEventWaitlist(eventId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const { count, rows } = await Waitlist.findAndCountAll({
      where: { eventId, status: 'active' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['position', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      waitlist: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalWaitlisted: count
      }
    };
  }
}

module.exports = new WaitlistService();
