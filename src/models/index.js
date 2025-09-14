const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Event = require('./Event')(sequelize, Sequelize.DataTypes);
const Booking = require('./Booking')(sequelize, Sequelize.DataTypes);
const Waitlist = require('./Waitlist')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Event, { 
  foreignKey: 'createdBy', 
  as: 'createdEvents' 
});
Event.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

User.hasMany(Booking, { 
  foreignKey: 'userId', 
  as: 'bookings' 
});
Booking.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

Event.hasMany(Booking, { 
  foreignKey: 'eventId', 
  as: 'bookings' 
});
Booking.belongsTo(Event, { 
  foreignKey: 'eventId', 
  as: 'event' 
});

// Waitlist associations
User.hasMany(Waitlist, { 
  foreignKey: 'userId', 
  as: 'waitlists' 
});
Waitlist.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

Event.hasMany(Waitlist, { 
  foreignKey: 'eventId', 
  as: 'waitlists' 
});
Waitlist.belongsTo(Event, { 
  foreignKey: 'eventId', 
  as: 'event' 
});

const db = {
  sequelize,
  Sequelize,
  User,
  Event,
  Booking,
  Waitlist
};

module.exports = db;
