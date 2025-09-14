const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./config/database');
const redisClient = require('./config/redis');
const { generalLimiter } = require('./middleware/rateLimiter');
const queueService = require('./services/queueService');
const clusterService = require('./services/clusterService');
const { requestMonitoring, healthCheck } = require('./middleware/instanceMonitoring');
const { trackRequest, getMetrics, resetMetrics } = require('./middleware/performanceMonitoring');

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const analyticsRoutes = require('./routes/analytics');
const waitlistRoutes = require('./routes/waitlist');
const optimizedRoutes = require('./routes/optimized');
const clusterRoutes = require('./routes/cluster');

const app = express();
const PORT = process.env.PORT || 3000;

// Instance monitoring middleware
app.use(requestMonitoring);
app.use(healthCheck);

// Security and logging middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Conditional rate limiting - disable for load testing
if (process.env.NODE_ENV !== 'load-test') {
  app.use(generalLimiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add performance tracking middleware
app.use(trackRequest);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/optimized', optimizedRoutes);
app.use('/api/cluster', clusterRoutes);

// Serve static files for load testing
app.use('/public', express.static('public'));

// Load testing dashboard
app.get('/load-test', (req, res) => {
  res.sendFile(__dirname + '/../public/load-test.html');
});

// Enhanced health check with load info
app.get('/api/health', (req, res) => {
  const instanceId = clusterService.instanceId;
  const processId = process.pid;
  
  res.setHeader('X-Instance-ID', instanceId);
  res.setHeader('X-Process-ID', processId);
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    instance: {
      id: instanceId,
      pid: processId,
      requestCount: clusterService.requestCount
    }
  });
});

// Add a test endpoint to verify load balancing
app.get('/api/test-instance', (req, res) => {
  res.json({
    instanceId: clusterService.instanceId,
    processId: process.pid,
    timestamp: Date.now(),
    message: `Request handled by instance ${clusterService.instanceId}`
  });
});

// Redis health check endpoint
app.get('/api/health/redis', async (req, res) => {
  try {
    const redis = redisClient.getClient();
    const result = await redis.ping();
    
    res.status(200).json({
      status: 'OK',
      redis: 'Connected',
      ping: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      redis: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Queue monitoring endpoint
app.get('/api/health/queues', async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();
    
    res.status(200).json({
      status: 'OK',
      queues: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test database models endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const db = require('./models');
    const userCount = await db.User.count();
    const eventCount = await db.Event.count();
    const bookingCount = await db.Booking.count();
    
    res.json({
      message: 'Database models working',
      counts: {
        users: userCount,
        events: eventCount,
        bookings: bookingCount
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database error',
      details: error.message
    });
  }
});

// Performance metrics endpoint
app.get('/api/metrics/performance', (req, res) => {
  const metrics = getMetrics();
  res.json({
    message: 'Performance metrics retrieved',
    data: metrics,
    timestamp: new Date().toISOString()
  });
});

// Reset metrics endpoint (for testing)
app.post('/api/metrics/reset', (req, res) => {
  resetMetrics();
  res.json({
    message: 'Metrics reset successfully',
    timestamp: new Date().toISOString()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Evently Backend API',
    version: '1.0.0',
    status: 'Running'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Disable cluster mode for single Render instance
  process.env.CLUSTER_MODE = 'false';
  
  // Trust proxy (for Render load balancer)
  app.set('trust proxy', 1);
  
  // Production CORS settings
  app.use(cors({
    origin: process.env.FRONTEND_URL || false,
    credentials: true
  }));
}

// Database connection and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Initialize Redis
    redisClient.getClient();
    
    // Initialize cluster service
    await clusterService.registerInstance();
    clusterService.startHeartbeat();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Instance ID: ${clusterService.instanceId}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await clusterService.shutdown();
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await clusterService.shutdown();
  await sequelize.close();
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
