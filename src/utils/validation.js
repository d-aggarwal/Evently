const Joi = require('joi');

const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    password: Joi.string().min(6).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
  }),

  createAdmin: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    adminToken: Joi.string().required()  // Add this line
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
  })
};

const eventValidation = {
  create: Joi.object({
    name: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).optional(),
    venue: Joi.string().min(3).max(200).required(),
    address: Joi.string().max(500).optional(),
    dateTime: Joi.date().greater('now').required(),
    totalCapacity: Joi.number().integer().min(1).max(100000).required(),
    price: Joi.number().min(0).required(),
    category: Joi.string().valid('concert', 'conference', 'workshop', 'sports', 'theater', 'other').optional()
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    venue: Joi.string().min(3).max(200).optional(),
    address: Joi.string().max(500).optional(),
    dateTime: Joi.date().greater('now').optional(),
    totalCapacity: Joi.number().integer().min(1).max(100000).optional(),
    price: Joi.number().min(0).optional(),
    category: Joi.string().valid('concert', 'conference', 'workshop', 'sports', 'theater', 'other').optional(),
    status: Joi.string().valid('draft', 'published', 'cancelled').optional()
  })
};

const bookingValidation = {
  create: Joi.object({
    eventId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).max(10).required()
  }),

  cancel: Joi.object({
    reason: Joi.string().max(500).optional()
  })
};

module.exports = {
  authValidation,
  eventValidation,
  bookingValidation
};
