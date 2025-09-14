# Evently Backend - System Architecture Diagram

```
                           EVENTLY BACKEND ARCHITECTURE
    
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                              CLIENT LAYER                                   │
    │    Web App    │    Mobile App    │    Admin Dashboard    │    Postman/API   │
    └─────────────────────────────┬───────────────────────────────────────────────┘
                                  │
                                  │ HTTPS/REST API Calls
                                  │
    ┌─────────────────────────────▼───────────────────────────────────────────────┐
    │                         API GATEWAY LAYER                                   │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
    │  │Rate Limiting│ │    CORS     │ │   Helmet    │ │     Morgan Logging      │ │
    │  │100 req/15min│ │ Protection  │ │ Security    │ │    Request Tracking     │ │
    │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘ │
    └─────────────────────────────┬───────────────────────────────────────────────┘
                                  │
    ┌─────────────────────────────▼───────────────────────────────────────────────┐
    │                        EXPRESS.JS APPLICATION                               │
    │                                                                             │
    │  ┌─────────────────────────────────────────────────────────────────────┐    │
    │  │                         ROUTE LAYER                                 │    │
    │  │ /auth │ /events │ /bookings │ /waitlist │ /analytics │ /health     │    │
    │  └─────────────────────────┬───────────────────────────────────────────┘    │
    │                            │                                                │
    │  ┌─────────────────────────▼───────────────────────────────────────────┐    │
    │  │                    CONTROLLER LAYER                                 │    │
    │  │ AuthController │ EventController │ BookingController │ Analytics   │    │
    │  └─────────────────────────┬───────────────────────────────────────────┘    │
    │                            │                                                │
    │  ┌─────────────────────────▼───────────────────────────────────────────┐    │
    │  │                    MIDDLEWARE LAYER                                 │    │
    │  │  JWT Auth │ Joi Validation │ Error Handling │ Instance Tracking    │    │
    │  └─────────────────────────┬───────────────────────────────────────────┘    │
    │                            │                                                │
    │  ┌─────────────────────────▼───────────────────────────────────────────┐    │
    │  │                     SERVICE LAYER                                   │    │
    │  │ AuthService │ EventService │ BookingService │ WaitlistService │     │    │
    │  │             │             │ (Smart Booking) │ (Position Track) │    │    │
    │  └─────────────────────────┬───────────────────────────────────────────┘    │
    └──────────────────────────┬─┼─────────────────────────────────────────────────┘
                               │ │
                   ┌───────────┼─┼─────────────┐
                   │           │ │             │
                   ▼           ▼ ▼             ▼
    ┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
    │   CACHING LAYER  │ │  DATABASE LAYER │ │   QUEUE SYSTEM   │
    │                  │ │                 │ │                  │
    │      Redis       │ │   PostgreSQL    │ │   Bull Queue     │
    │    (Upstash)     │ │                 │ │   (Redis-based)  │
    │                  │ │ ┌─────────────┐ │ │                  │
    │ ┌──────────────┐ │ │ │   Users     │ │ │ ┌──────────────┐ │
    │ │ Distributed  │ │ │ │   Events    │ │ │ │   Booking    │ │
    │ │   Locking    │ │ │ │  Bookings   │ │ │ │  Processing  │ │
    │ │              │ │ │ │ Waitlists   │ │ │ │              │ │
    │ │  Session     │ │ │ └─────────────┘ │ │ │  Waitlist    │ │
    │ │ Management   │ │ │                 │ │ │ Processing   │ │
    │ └──────────────┘ │ │ ACID Compliant  │ │ └──────────────┘ │
    │                  │ │ Transactions    │ │                  │
    │    Status:       │ │                 │ │    Status:       │
    │  Implemented     │ │    Status:      │ │  Implemented     │
    │   (Disabled)     │ │     Active      │ │   (Disabled)     │
    └──────────────────┘ └─────────────────┘ └──────────────────┘
                                 │
                                 │
    ┌────────────────────────────▼─────────────────────────────────────────────┐
    │                    CONCURRENCY CONTROL FLOW                             │
    │                                                                          │
    │  Request ──► JWT Auth ──► Validation ──► Transaction Start              │
    │                                              │                          │
    │                                              ▼                          │
    │                                       Capacity Check                    │
    │                                              │                          │
    │                               ┌──────── Available? ────────┐            │
    │                               │                            │            │
    │                              Yes                          No            │
    │                               │                            │            │
    │                               ▼                            ▼            │
    │                        Create Booking                Add to Waitlist    │
    │                               │                            │            │
    │                               ▼                            ▼            │
    │                        Update Capacity              Return Position     │
    │                               │                            │            │
    │                               └────► Commit Transaction ◄─┘            │
    └──────────────────────────────────────────────────────────────────────────┘
