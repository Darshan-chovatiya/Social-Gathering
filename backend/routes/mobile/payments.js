/**
 * Mobile API - Payments routes for customer panel
 * Base path: /api/mobile/payments
 */
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
} = require('../../controllers/mobile/payments.controller');

// Public (no auth)
router.get('/razorpay-key', asyncHandler(getRazorpayKey));
router.post('/create-razorpay-order', asyncHandler(createRazorpayOrder));

// Auth + mobile verification required
router.use(authenticate);
router.use(requireMobileVerification);

router.post('/create-order', createOrderValidation, validate, asyncHandler(createOrder));
router.post('/verify', verifyPaymentValidation, validate, asyncHandler(verifyPayment));
router.post('/store', storePaymentValidation, validate, asyncHandler(storePayment));
router.get('/booking/:bookingId', asyncHandler(getPaymentByBookingId));
// router.get('/:id', asyncHandler(getPaymentById));

module.exports = router;
