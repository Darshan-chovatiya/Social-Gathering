const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const {
  getMyAffiliateLinks,
  getAffiliateLinkDetails,
  getReferrals,
} = require('../../controllers/affiliateLink.controller');

// All routes require authentication
router.use(authenticate);

// Get user's affiliate links
router.get('/affiliate-links/my-links', asyncHandler(getMyAffiliateLinks));

// Get affiliate link details
router.get('/affiliate-links/:linkId', asyncHandler(getAffiliateLinkDetails));

// Get referrals list for an affiliate link
router.get('/affiliate-links/:linkId/referrals', asyncHandler(getReferrals));

module.exports = router;

