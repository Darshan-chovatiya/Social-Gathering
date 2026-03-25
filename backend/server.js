const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment configuration
require('./config/env');
const connectDB = require('./config/database');
const corsOptions = require('./config/cors');
const logger = require('./config/logger');
const config = require('./config/env');

// Import routes
const authRoutes = require('./routes/auth');

// Public routes
const publicEventRoutes = require('./routes/public/events');
const publicCategoryRoutes = require('./routes/public/categories');
const publicOfferRoutes = require('./routes/public/offers');
const publicBookingRoutes = require('./routes/public/booking');

// User routes
const userRoutes = require('./routes/users/index');
const userBookingRoutes = require('./routes/users/booking');
const userPaymentRoutes = require('./routes/users/payment');
const userAffiliateRoutes = require('./routes/users/affiliate');

// Organizer routes
const organizerRoutes = require('./routes/organizer/index');
const organizerReportRoutes = require('./routes/organizer/reports');
const organizerAffiliateRoutes = require('./routes/organizer/affiliate');

// Public affiliate routes
const affiliateRoutes = require('./routes/affiliate');

// Admin routes
const adminRoutes = require('./routes/admin/index');

// Mobile API (customer panel / mobile app)
const mobileRoutes = require('./routes/mobile/index');

// Notification routes
const notificationRoutes = require('./routes/notification.routes.js');

// Farmhouse routes
const farmhouseRoutes = require('./routes/farmhouse.routes');
// Banquet routes
const banquetRoutes = require('./routes/banquet.routes');

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (development only)
if (config.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
    });
    next();
  });
}

// Database connection
connectDB();

// Public Routes (No authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/events', publicEventRoutes);
app.use('/api/categories', publicCategoryRoutes);
app.use('/api/offers', publicOfferRoutes);
app.use('/api/bookings', publicBookingRoutes);
app.use('/api/affiliate', affiliateRoutes);

// User Routes (Authentication required)
app.use('/api/users', userRoutes);
app.use('/api/users/bookings', userBookingRoutes);
app.use('/api/users/payments', userPaymentRoutes);
app.use('/api/users', userAffiliateRoutes);

// Organizer Routes (Organizer authentication required)
app.use('/api/organizer', organizerRoutes);
app.use('/api/organizer/reports', organizerReportRoutes);
app.use('/api/organizer', organizerAffiliateRoutes);

// Admin Routes (Admin authentication required)
app.use('/api/admin', adminRoutes);

// Mobile API (customer panel / mobile app - all customer APIs under one base)
app.use('/api/mobile', mobileRoutes);

// Notification Routes
app.use('/api/notifications', notificationRoutes);

// Farmhouse Routes
app.use('/api/farmhouses', farmhouseRoutes);
// Banquet Routes
app.use('/api/banquets', banquetRoutes);

// Health check
const { sendSuccess } = require('./utils/response');

app.get('/api/health', (req, res) => {
  sendSuccess(res, 'Prime Tickets API is running', { status: 'OK' });
});

// Error handling middleware
const { sendError } = require('./utils/response');

app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error details
  logger.error('Error:', {
    message: err.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });
  
  // Send error response
  sendError(res, message, statusCode);
});

const PORT = config.PORT;

app.listen(PORT, () => {
  logger.info(`Server is running in ${config.NODE_ENV} mode on port ${PORT}`);
  if (config.NODE_ENV === 'development') {
    logger.info(`API Health Check: http://localhost:${PORT}/api/health`);
  }
});

