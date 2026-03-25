const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate, requireMobileVerification } = require('../../middleware/auth');
const {
  createOrderValidation,
  verifyPaymentValidation,
  storePaymentValidation,
} = require('../../validators/payment.validator');
const {
  createOrder,
  verifyPayment,
  getPaymentById,
  getRazorpayKey,
  createRazorpayOrder,
  storePayment,
  getPaymentByBookingId,
} = require('../../controllers/payment.controller');

// Get Razorpay key (public endpoint, no auth needed for key ID)
router.get('/razorpay-key', asyncHandler(getRazorpayKey));

// Create Razorpay order only (minimal - just creates order, no payment processing)
// This endpoint doesn't require auth for simplicity, but you can add auth if needed
router.post('/create-razorpay-order', asyncHandler(createRazorpayOrder));

// All other routes require authentication and mobile verification
router.use(authenticate);
router.use(requireMobileVerification);

// Create payment order
router.post('/create-order', createOrderValidation, validate, asyncHandler(createOrder));

// Verify payment
router.post('/verify', verifyPaymentValidation, validate, asyncHandler(verifyPayment));

// Store payment details (called from frontend after payment)
router.post('/store', storePaymentValidation, validate, asyncHandler(storePayment));

// Get payment by booking ID (must be before /:id route)
router.get('/booking/:bookingId', asyncHandler(getPaymentByBookingId));

// Get payment status
router.get('/:id', asyncHandler(getPaymentById));

module.exports = router;

