module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 200]
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfter: new Date().toISOString()
      }
    },
    totalCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100000
      }
    },
    availableCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['concert', 'conference', 'workshop', 'sports', 'theater', 'other']]
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
      defaultValue: 'draft',
      allowNull: false
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'events',
    timestamps: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['venue']
      },
      {
        fields: ['dateTime']
      },
      {
        fields: ['status']
      },
      {
        fields: ['category']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['dateTime', 'status']
      },
      {
        fields: ['availableCapacity']
      }
    ]
  });

  return Event;
};
