/**
 * Mobile API - Customer panel / mobile app
 * Base path: /api/mobile
 *
 * All customer-panel APIs in one place for mobile app consumption.

 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const publicRoutes = require('./public');
const userRoutes = require('./user');
const bookingsRoutes = require('./bookings');
const paymentsRoutes = require('./payments');
const affiliateRoutes = require('./affiliate');
const organizerRoutes = require('./organizer');
const notificationRoutes = require('../notification.routes');

// Auth: /api/mobile/auth
router.use('/auth', authRoutes);

// Organizer: /api/mobile/organizers
router.use('/organizers', organizerRoutes);

// Notifications: /api/mobile/notifications
router.use('/notifications', notificationRoutes);

// Public (no auth): /api/mobile/events, /categories, /offers, /affiliate/:code, /bookings/verify-qr
router.use('/', publicRoutes);

// User (auth): /api/mobile/user/profile, /user/events, /user/upcoming-events, etc.
router.use('/user', userRoutes);

// Bookings: /api/mobile/bookings (verify-qr is in public; list/create/get/cancel here with auth)
router.use('/bookings', bookingsRoutes);

// Payments: /api/mobile/payments
router.use('/payments', paymentsRoutes);

// Affiliate links: /api/mobile/affiliate-links
router.use('/affiliate-links', affiliateRoutes);

// Farmhouses: /api/mobile/farmhouses
const farmhouseRoutes = require('./farmhouse');
router.use('/farmhouses', farmhouseRoutes);

// Banquets: /api/mobile/banquets
const banquetRoutes = require('./banquet');
router.use('/banquets', banquetRoutes);

module.exports = router;
