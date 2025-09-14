'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      venue: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      dateTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      totalCapacity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      availableCapacity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'cancelled', 'completed'),
        defaultValue: 'draft',
        allowNull: false
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
    await queryInterface.addIndex('events', ['name']);
    await queryInterface.addIndex('events', ['venue']);
    await queryInterface.addIndex('events', ['dateTime']);
    await queryInterface.addIndex('events', ['status']);
    await queryInterface.addIndex('events', ['category']);
    await queryInterface.addIndex('events', ['createdBy']);
    await queryInterface.addIndex('events', ['dateTime', 'status']);
    await queryInterface.addIndex('events', ['availableCapacity']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('events');
  }
};
