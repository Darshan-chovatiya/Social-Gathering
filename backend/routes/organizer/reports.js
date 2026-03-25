const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, authorize } = require('../../middleware/auth');
const {
  getEventWiseBookings,
  getRevenueReport,
  getCategoryWiseSales,
} = require('../../controllers/report.controller');

// All routes require organizer authentication
router.use(authenticate);
router.use(authorize('organizer'));

// Get event-wise bookings (for organizer's events)
router.get('/event-wise-bookings', asyncHandler(getEventWiseBookings));

// Get revenue report (for organizer's events)
router.get('/revenue', asyncHandler(getRevenueReport));

// Get category-wise sales (for organizer's events)
router.get('/category-wise-sales', asyncHandler(getCategoryWiseSales));

module.exports = router;

