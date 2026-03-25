const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, authorize } = require('../../middleware/auth');
const {
  createAffiliateLink,
  getAffiliateLinkDetails,
  getReferrals,
  deactivateAffiliateLink,
  checkAffiliateLinkExists,
} = require('../../controllers/affiliateLink.controller');

// All routes require organizer authentication
router.use(authenticate);
router.use(authorize('organizer'));

// Check if affiliate link exists for customer and event
router.get('/affiliate-links/check', asyncHandler(checkAffiliateLinkExists));

// Create affiliate link for a booking
router.post('/affiliate-links', asyncHandler(createAffiliateLink));

// Get affiliate link details
router.get('/affiliate-links/:linkId', asyncHandler(getAffiliateLinkDetails));

// Get referrals list for an affiliate link
router.get('/affiliate-links/:linkId/referrals', asyncHandler(getReferrals));

// Deactivate affiliate link
router.put('/affiliate-links/:linkId/deactivate', asyncHandler(deactivateAffiliateLink));

module.exports = router;

