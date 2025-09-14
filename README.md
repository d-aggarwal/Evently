# Evently Backend

A scalable event booking platform backend that handles concurrent ticket bookings, prevents overselling, and provides analytics for event organizers.

## Features

- User authentication and event browsing
- Concurrent booking system with race condition prevention
- Waitlist management for sold-out events
- Admin dashboard with booking analytics
- Real-time capacity tracking

## Tech Stack

- Node.js + Express
- PostgreSQL + Sequelize ORM
- Redis for caching and locking
- JWT authentication
- Bull queue for background jobs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=evently
JWT_SECRET=your_secret_key
ADMIN_CREATION_TOKEN=your_admin_token
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/create-admin` - Create admin (requires admin token)

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event (admin only)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (admin only)
- `DELETE /api/events/:id` - Delete event (admin only)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user's bookings
- `DELETE /api/bookings/:id` - Cancel booking

### Waitlist
- `POST /api/waitlist` - Join waitlist
- `GET /api/waitlist/position/:eventId` - Get waitlist position
- `DELETE /api/waitlist/:eventId` - Leave waitlist

### Analytics (Admin)
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/events` - Event performance

## Design Decisions

### Concurrency Handling
Used database transactions with row-level locking to prevent race conditions during booking. This ensures no overselling even with simultaneous requests.

### Database Schema
- Users table with role-based access (user/admin)
- Events table with capacity tracking
- Bookings table with reference generation
- Waitlist table with position management

### Scalability Approach
- Connection pooling for database efficiency
- Redis for distributed locking and session management
- Queue-based processing for high-load scenarios
- Optimized database indexes for common queries

### Creative Features
- Automatic waitlist processing when tickets become available
- Real-time capacity updates with rollback on cancellation
- Comprehensive analytics dashboard for admins
- Booking reference system for easy tracking

## Database Schema

```
Users
- id (UUID)
- email (unique)
- firstName, lastName
- passwordHash
- role (user/admin)

Events
- id (UUID)
- name, venue, dateTime
- totalCapacity, availableCapacity
- price, category, status
- createdBy (foreign key)

Bookings
- id (UUID)
- bookingReference (unique)
- userId, eventId (foreign keys)
- quantity, totalAmount
- status (confirmed/cancelled)

Waitlist
- id (UUID)
- userId, eventId (foreign keys)
- position, quantity
- status (active/notified/converted)
```

## Error Handling

The API returns consistent error responses:
```json
{
  "error": "Error message",
  "details": "Additional information"