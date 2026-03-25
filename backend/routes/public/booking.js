const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const { verifyQRCode } = require('../../controllers/booking.controller');

// Public route to verify QR code and get ticket details
router.post('/verify-qr', asyncHandler(verifyQRCode));

module.exports = router;

