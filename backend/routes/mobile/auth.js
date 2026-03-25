/**
 * Mobile API - Auth routes (customer panel)
 * Base path: /api/mobile/auth
 */
const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const {
  sendOTPValidation,
  verifyOTPValidation,
  googleSignInValidation,
} = require('../../validators/auth.validator');
const {
  sendOTP,
  verifyOTP,
  googleSignIn,
  getCurrentUser,
} = require('../../controllers/mobile/auth.controller');

// Send OTP
router.post('/send-otp', sendOTPValidation, validate, asyncHandler(sendOTP));

// Verify OTP and login/register
router.post('/verify-otp', verifyOTPValidation, validate, asyncHandler(verifyOTP));

// Google Sign-In
router.post('/google-signin', googleSignInValidation, validate, asyncHandler(googleSignIn));

// Get current user (auth required)
router.get('/me', authenticate, asyncHandler(getCurrentUser));

module.exports = router;
