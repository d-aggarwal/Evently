module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingReference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
      defaultValue: 'confirmed',
      allowNull: false
    },
    bookedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancellationReason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'bookings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['bookingReference']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['eventId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['bookedAt']
      },
      {
        fields: ['userId', 'status']
      },
      {
        fields: ['eventId', 'status']
      }
    ],
    hooks: {
      beforeCreate: (booking) => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        booking.bookingReference = `EVT-${timestamp}-${random}`.toUpperCase();
      }
    }
  });

  return Booking;
};
