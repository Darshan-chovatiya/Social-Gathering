const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');

const {
  getAllFarmhouses,
  getFarmhouseById
} = require('../../controllers/mobile/farmhouse.public.controller');

const {
  checkAvailability,
  calculateTotalPrice,
  createBooking,
  getMyBookings,
  getBookingById
} = require('../../controllers/mobile/farmhouse.user.controller');

const {
  createEnquiry
} = require('../../controllers/farmhouseEnquiry.controller');

// Public routes
router.get('/', asyncHandler(getAllFarmhouses));
router.get('/check-availability', asyncHandler(checkAvailability));
router.get('/:id', asyncHandler(getFarmhouseById));
router.post('/enquiry', asyncHandler(createEnquiry));

// Authenticated routes
router.post('/calculate-price', authenticate, asyncHandler(calculateTotalPrice));
router.post('/bookings', authenticate, asyncHandler(createBooking));
router.get('/user/bookings', authenticate, asyncHandler(getMyBookings));
router.get('/bookings/:bookingId', authenticate, asyncHandler(getBookingById));

module.exports = router;
