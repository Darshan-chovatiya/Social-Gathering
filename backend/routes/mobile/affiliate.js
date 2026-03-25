/**
 * Mobile API - Affiliate links routes (auth) for customer panel
 * Base path: /api/mobile/affiliate-links
 */
const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const {
  getMyAffiliateLinks,
  getAffiliateLinkDetails,
  getReferrals,
} = require('../../controllers/mobile/affiliate.controller');

router.use(authenticate);

router.get('/my-links', asyncHandler(getMyAffiliateLinks));
router.get('/:linkId/referrals', asyncHandler(getReferrals));
router.get('/:linkId', asyncHandler(getAffiliateLinkDetails));

module.exports = router;
