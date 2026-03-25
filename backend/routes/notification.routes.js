const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// All notification routes require authentication
router.use(authenticate);

// Get my notifications (common for all roles)
router.get('/my', asyncHandler(notificationController.getMyNotifications));

// Get unread count
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));

// Get all portal customers (for organizers/admins)
router.get('/customers', authorize('organizer', 'admin'), asyncHandler(notificationController.getAllPortalCustomers));

// Mark as read
router.patch('/:id/read', asyncHandler(notificationController.markAsRead));

// Mark all as read
router.patch('/read-all', asyncHandler(notificationController.markAllRead));

// Update FCM Token
router.post('/fcm-token', asyncHandler(notificationController.updateFcmToken));

// Organizer/Admin only routes
router.post('/send-to-user', authorize('organizer', 'admin'), asyncHandler(notificationController.sendToUser));
router.post('/send-to-event', authorize('organizer', 'admin'), asyncHandler(notificationController.sendToEventCustomers));
router.post('/send-to-all', authorize('organizer', 'admin'), asyncHandler(notificationController.sendToAllCustomers));
router.get('/sent', authorize('organizer', 'admin'), asyncHandler(notificationController.getSentNotifications));

module.exports = router;
