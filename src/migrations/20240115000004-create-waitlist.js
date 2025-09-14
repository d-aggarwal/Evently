'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('waitlists', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'notified', 'converted', 'expired'),
        defaultValue: 'active',
        allowNull: false
      },
      notifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('waitlists', ['userId', 'eventId'], { unique: true });
    await queryInterface.addIndex('waitlists', ['eventId', 'position']);
    await queryInterface.addIndex('waitlists', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('waitlists');
  }
};
