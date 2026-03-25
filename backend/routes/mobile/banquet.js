const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');

const {
  getAllBanquets,
  getBanquetById,
} = require('../../controllers/mobile/banquet.public.controller');

const {
  createEnquiry,
  getUserEnquiries
} = require('../../controllers/banquetEnquiry.controller');

// Public routes
router.get('/', asyncHandler(getAllBanquets));
router.get('/:id', asyncHandler(getBanquetById));
router.post('/enquiry', asyncHandler(createEnquiry));

// Authenticated routes
router.get('/user/enquiries', authenticate, asyncHandler(getUserEnquiries));

module.exports = router;
