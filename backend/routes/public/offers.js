const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const {
  getEventOffers,
} = require('../../controllers/offer.controller');

// Public offer routes - no authentication required

// Get available offers for an event
router.get('/event/:eventId', asyncHandler(getEventOffers));

module.exports = router;

