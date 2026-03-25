/**
 * Mobile API - Public routes (no auth) for customer panel
 * Base path: /api/mobile
 */
const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const {
  getAllEvents,
  getFeaturedEvents,
  getEventById,
  getActiveBanners,
  getAllCategories,
  getEventOffers,
  getAffiliateLinkByCode,
} = require('../../controllers/mobile/public.controller');

// ---- Events (order: specific before :id) ----
router.get('/events', asyncHandler(getAllEvents));
router.get('/events/featured', asyncHandler(getFeaturedEvents));
router.get('/events/banners/active', asyncHandler(getActiveBanners));
router.get('/events/:id', asyncHandler(getEventById));

// ---- Categories ----
router.get('/categories', asyncHandler(getAllCategories));

// ---- Offers (for an event) ----
router.get('/offers/event/:eventId', asyncHandler(getEventOffers));

// ---- Affiliate (validate code) ----
router.get('/affiliate/:code', asyncHandler(getAffiliateLinkByCode));

module.exports = router;
