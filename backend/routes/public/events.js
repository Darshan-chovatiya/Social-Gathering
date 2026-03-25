const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const {
  getAllEvents,
  getFeaturedEvents,
  getEventById,
  getActiveBanners,
} = require('../../controllers/event.controller');

// Public event routes - no authentication required

// Get all events (with filters)
router.get('/', asyncHandler(getAllEvents));

// Get featured events
router.get('/featured', asyncHandler(getFeaturedEvents));

// Get active banners (events with banners that haven't expired)
router.get('/banners/active', asyncHandler(getActiveBanners));

// Get event by ID
router.get('/:id', asyncHandler(getEventById));

module.exports = router;

