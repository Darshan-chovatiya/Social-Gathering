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
  createBooking,
  getBookingById,
  cancelBooking,
} = require('../../controllers/booking.controller');

// All routes require authentication and mobile verification
router.use(authenticate);
router.use(requireMobileVerification);

// Create booking
router.post('/', createBookingValidation, validate, asyncHandler(createBooking));

// Get booking by ID
router.get('/:id', asyncHandler(getBookingById));

// Cancel booking
router.put('/:id/cancel', cancelBookingValidation, validate, asyncHandler(cancelBooking));

module.exports = router;

