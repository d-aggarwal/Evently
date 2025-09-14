module.exports = (sequelize, DataTypes) => {
  const Waitlist = sequelize.define('Waitlist', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'notified', 'converted', 'expired'),
      defaultValue: 'active',
      allowNull: false
    },
    notifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'waitlists',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'eventId'],
        unique: true
      },
      {
        fields: ['eventId', 'position']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Waitlist;
};
