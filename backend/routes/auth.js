const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  sendOTPValidation,
  verifyOTPValidation,
  googleSignInValidation,
} = require('../validators/auth.validator');
const { adminLoginValidation } = require('../validators/admin.validator');
const {
  sendOTP,
  verifyOTP,
  adminLogin,
  organizerLogin,
  googleSignIn,
  getCurrentUser,
} = require('../controllers/auth.controller');

// Generate OTP
router.post('/send-otp', sendOTPValidation, validate, asyncHandler(sendOTP));

// Verify OTP and Login/Register
router.post('/verify-otp', verifyOTPValidation, validate, asyncHandler(verifyOTP));

// Google Sign-In
router.post('/google-signin', googleSignInValidation, validate, asyncHandler(googleSignIn));

// Admin Login (Email/Password)
router.post('/admin/login', adminLoginValidation, validate, asyncHandler(adminLogin));

// Organizer Login (Email/Password)
router.post('/organizer/login', adminLoginValidation, validate, asyncHandler(organizerLogin));

// Get current user
router.get('/me', authenticate, asyncHandler(getCurrentUser));

module.exports = router;
