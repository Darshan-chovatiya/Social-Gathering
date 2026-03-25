const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { getAffiliateLinkByCode } = require('../controllers/affiliateLink.controller');

// Public route - no authentication required
// Get affiliate link info by code (for validation)
router.get('/:code', asyncHandler(getAffiliateLinkByCode));

module.exports = router;

