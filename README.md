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

## 🛠 Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, Rate limiting
- **Caching**: Redis for distributed operations

## ⚡ Setup

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

## System Architecture

### Concurrency Handling
- **Database Transactions**: READ_COMMITTED isolation level
- **Atomic Operations**: Prevent race conditions during booking
- **Smart Locking**: Row-level locking for critical operations
- **Capacity Validation**: Real-time availability checks

### Advanced Features (Implemented but Currently Disabled)

#### Redis Distributed Caching & Locking
- **Status**: Implemented but disabled (`UPSTASH_REDIS_URL` connection issues)
- **Purpose**: Distributed locking for multi-instance coordination
- **Implementation**: ioredis client with Upstash Redis cloud service
- **Future**: Will be enabled once Redis connection is stabilized

#### Queue-Based Processing
- **Status**: Fully implemented but disabled (`USE_QUEUE=false`)
- **Technology**: Bull Queue with Redis backend
- **Features**:
  - Asynchronous booking processing
  - Retry mechanisms for failed jobs
  - Background waitlist processing
  - Job monitoring and metrics
- **Reason for Disable**: Redis connectivity issues in deployment
- **Future**: Enable for high-load scenarios (>1000 concurrent requests)

#### Horizontal Scaling Infrastructure
- **Status**: Implemented but simplified for deployment
- **Features**:
  - PM2 cluster mode configuration
  - Instance coordination via Redis
  - Load balancing preparation
  - Health monitoring across instances
- **Current**: Single instance mode for stability
- **Future**: Multi-instance deployment with proper Redis setup

### Performance Optimizations
- Connection pooling (10-50 connections)
- Strategic database indexing
- Rate limiting (100 requests/15min)
- Optimized query patterns

## Security Features

- JWT-based authentication with secure tokens
- Password hashing using bcryptjs
- Input validation with Joi schemas
- Rate limiting protection
- SQL injection prevention
- CORS and security headers

## Analytics Capabilities

### Revenue Tracking
- Daily/monthly revenue trends
- Booking conversion rates
- Popular events ranking

### Event Performance
- Capacity utilization rates
- Booking patterns analysis
- Cancellation statistics

### User Engagement
- Registration trends
- Active user metrics
- Booking behavior insights


**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🔧 Configuration

### Current Setup
```env
USE_QUEUE=false          # Will enable for production load
CLUSTER_MODE=true        # Ready for horizontal scaling
UPSTASH_REDIS_URL=...    # Configured but connection pending
```

### Production-Ready Features (Pending Redis)
- **Distributed Locking**: Prevent race conditions across instances
- **Queue Processing**: Handle thousands of concurrent bookings
- **Session Management**: Shared sessions across load-balanced instances
- **Real-time Metrics**: Cross-instance performance monitoring

## Deployment

### Current Deployment Strategy
- **Single Instance**: Optimized for stability and demonstration
- **Database Transactions**: Primary concurrency control mechanism
- **Future Scaling**: Ready for horizontal scaling once Redis is configured

### Scalability Roadmap
1. **Phase 1** (Current): Single instance with database-level concurrency
2. **Phase 2** (Next): Enable Redis for distributed operations
3. **Phase 3** (Production): Multi-instance with load balancing
4. **Phase 4** (Scale): Queue-based processing for peak loads

##  Future Enhancements

### Immediate Roadmap
- **Redis Integration**: Enable distributed caching and locking
- **Queue Activation**: Background job processing for high load
- **Multi-Instance**: Horizontal scaling with load balancing

### Advanced Features
- Real-time notifications for waitlist updates
- Seat-level booking for venue mapping
- Payment gateway integration
- Email notification system
- Microservices architecture migration

## Technical Implementation Notes

### Why Queue Processing is Disabled
The queue processing system using Bull Queue is fully implemented but currently disabled due to Redis connection configuration challenges in the deployment environment. The system falls back to direct database processing, which still maintains ACID compliance and handles moderate concurrent loads effectively.

### Redis Implementation Status
Redis integration for distributed locking and caching is implemented with Upstash cloud service. The connection configuration needs adjustment for the production environment, after which distributed features will be enabled.

### Scalability Architecture
The codebase includes complete horizontal scaling infrastructure including:
- PM2 cluster configuration
- Inter-instance coordination
- Distributed job processing
- Load balancer preparation

Currently running in single-instance mode for demonstration stability.
