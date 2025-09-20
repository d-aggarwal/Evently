# Evently Backend

A scalable event booking platform that handles concurrent ticket bookings, prevents overselling, and provides comprehensive analytics for event organizers.

##  Features

### User Features
- Browse upcoming events with real-time capacity tracking
- Smart booking system with partial booking and automatic waitlisting
- View booking history and manage reservations
- Join and track waitlist positions

### Admin Features
- Complete event lifecycle management (create, update, delete)
- Real-time booking analytics and revenue tracking
- User engagement metrics and popular events insights
- Waitlist management and monitoring

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, Rate limiting
- **Caching**: Redis for distributed operations

## Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd evently-backend
npm install
```

2. **Environment configuration:**
```bash
cp .env.example .env
# Update .env with your database and Redis credentials
```

3. **Database setup:**
```bash
npm run db:migrate
```

4. **Start development server:**
```bash
npm run dev
```

##  API Endpoints

### Authentication


| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/create-admin` | Create admin account | Admin Token |

### Events Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/events` | List all published events | No |
| GET | `/api/events/:id` | Get event details | No |
| POST | `/api/events` | Create new event | Admin |
| PUT | `/api/events/:id` | Update event | Admin |
| DELETE | `/api/events/:id` | Delete event | Admin |

### Booking System
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/bookings` | Create booking | User |
| GET | `/api/bookings` | Get user's bookings | User |
| GET | `/api/bookings/:id` | Get booking details | User |
| DELETE | `/api/bookings/:id` | Cancel booking | User |

### Waitlist Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/waitlist` | Join event waitlist | User |
| GET | `/api/waitlist` | Get user's waitlists | User |
| DELETE | `/api/waitlist/:eventId` | Leave waitlist | User |

### Analytics Dashboard
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/analytics/overview` | Dashboard metrics | Admin |
| GET | `/api/analytics/revenue` | Revenue analytics | Admin |
| GET | `/api/analytics/events` | Event performance | Admin |

## Booking System

### Intelligent Capacity Handling
When a user requests more tickets than available:

**Example Scenario:**
- Event capacity: 2 tickets available
- User requests: 10 tickets

**System Response:**
1.  Books 2 tickets immediately
2.  Adds remaining 8 tickets to waitlist
3.  Returns both booking confirmation and waitlist position

```json
{
  "message": "Booked 2 tickets. Remaining 8 tickets added to waitlist.",
  "data": {
    "booking": { "bookingReference": "EVT-ABC123", "quantity": 2 },
    "waitlistEntry": { "position": 1, "quantity": 8 }
  }
}
```
