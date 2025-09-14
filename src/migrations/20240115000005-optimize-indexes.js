'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Composite indexes for common query patterns
    await queryInterface.addIndex('events', 
      ['dateTime', 'status', 'availableCapacity'], 
      { 
        name: 'idx_events_datetime_status_capacity',
        where: { status: 'published' }
      }
    );

    await queryInterface.addIndex('events', 
      ['category', 'dateTime'], 
      { 
        name: 'idx_events_category_datetime',
        where: { status: 'published' }
      }
    );

    await queryInterface.addIndex('bookings', 
      ['userId', 'createdAt'], 
      { name: 'idx_bookings_user_created' }
    );

    await queryInterface.addIndex('bookings', 
      ['eventId', 'status', 'createdAt'], 
      { name: 'idx_bookings_event_status_created' }
    );

    await queryInterface.addIndex('waitlists', 
      ['eventId', 'status', 'position'], 
      { name: 'idx_waitlists_event_status_position' }
    );

    // Covering indexes for analytics queries
    await queryInterface.addIndex('bookings', 
      ['createdAt', 'status', 'totalAmount'], 
      { name: 'idx_bookings_analytics' }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('events', 'idx_events_datetime_status_capacity');
    await queryInterface.removeIndex('events', 'idx_events_category_datetime');
    await queryInterface.removeIndex('bookings', 'idx_bookings_user_created');
    await queryInterface.removeIndex('bookings', 'idx_bookings_event_status_created');
    await queryInterface.removeIndex('waitlists', 'idx_waitlists_event_status_position');
    await queryInterface.removeIndex('bookings', 'idx_bookings_analytics');
  }
};
