# Evently Backend

A scalable event booking platform backend built with Node.js, Express, PostgreSQL, and Redis.

## Features

- User Authentication with JWT
- Event Management System
- Concurrent Booking System with Race Condition Prevention
- Queue-based Processing for High Load
- Waitlist System
- Real-time Analytics Dashboard
- Horizontal Scaling Support
- Production-ready Configuration

## Tech Stack

- Node.js & Express
- PostgreSQL with Sequelize ORM
- Redis for Caching & Queue
- Bull for Job Processing
- PM2 for Process Management
- JWT for Authentication

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 13
- Redis >= 6
- PM2 (for clustering)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/evently-backend.git
cd evently-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npm run db:migrate
```

## Running the Application

### Development
```bash
npm run dev
```

### Production with PM2
```bash
npm run cluster:start
```

## API Documentation

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile

### Events
- GET /api/events - List all events
- POST /api/events - Create event (Admin)
- GET /api/events/:id - Get event details
- PUT /api/events/:id - Update event (Admin)
- DELETE /api/events/:id - Delete event (Admin)

### Bookings
- POST /api/bookings - Create booking
- GET /api/bookings - List user's bookings
- GET /api/bookings/:id - Get booking details
- DELETE /api/bookings/:id - Cancel booking

### Analytics (Admin)
- GET /api/analytics/overview - Dashboard overview
- GET /api/analytics/events - Event analytics
- GET /api/analytics/revenue - Revenue analytics

## License

MIT

## Author

YOUR_NAME
