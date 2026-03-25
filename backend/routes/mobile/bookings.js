/**
 * Mobile API - Bookings routes (auth + mobile verification) for customer panel
 * Base path: /api/mobile/bookings
 */
const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate, requireMobileVerification } = require('../../middleware/auth');
const {
  createBookingValidation,
  cancelBookingValidation,
} = require('../../validators/booking.validator');
const {
  verifyQRCode,
  getBookings,
  createBooking,
  getBookingById,
  cancelBooking,
} = require('../../controllers/mobile/bookings.controller');

// Public: verify QR code (no auth)
router.post('/verify-qr', asyncHandler(verifyQRCode));

router.use(authenticate);
router.use(requireMobileVerification);

// List my bookings
router.get('/', asyncHandler(getBookings));

// Create booking
router.post('/', createBookingValidation, validate, asyncHandler(createBooking));

// Get booking by ID
router.get('/:id', asyncHandler(getBookingById));

// Cancel booking
router.put('/:id/cancel', cancelBookingValidation, validate, asyncHandler(cancelBooking));

module.exports = router;
