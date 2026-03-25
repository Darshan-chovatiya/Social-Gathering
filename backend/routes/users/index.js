const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate, requireMobileVerification } = require('../../middleware/auth');
const { updateProfileValidation, changePasswordValidation } = require('../../validators/user.validator');
const {
  getProfile,
  updateProfile,
  changePassword,
  getBookings,
  getUpcomingEvents,
  getActiveBanners,
  getEvents,
  getEventById,
  getFeaturedEvents,
  getCategories,
  getEventOffers,
} = require('../../controllers/user.controller');
const { getSponsorByIdForUsers } = require('../../controllers/sponsor.controller');

// Configure multer for user profile picture uploads
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/users/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadUserImage = multer({
  storage: userStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  },
});

// Profile routes (Authentication required)
router.get('/profile', authenticate, asyncHandler(getProfile));
router.put('/profile', authenticate, uploadUserImage.single('profilePicture'), updateProfileValidation, validate, asyncHandler(updateProfile));
router.put('/change-password', authenticate, changePasswordValidation, validate, asyncHandler(changePassword));

// Booking routes (Authentication and mobile verification required)
router.get('/bookings', authenticate, requireMobileVerification, asyncHandler(getBookings));
router.get('/upcoming-events', authenticate, requireMobileVerification, asyncHandler(getUpcomingEvents));

// Public routes for customer panel (No authentication required)
// Banners
router.get('/banners/active', asyncHandler(getActiveBanners));

// Events (order matters - specific routes before parameterized routes)
router.get('/events/featured', asyncHandler(getFeaturedEvents));
router.get('/events', asyncHandler(getEvents));
router.get('/events/:id', asyncHandler(getEventById));

// Categories
router.get('/categories', asyncHandler(getCategories));

// Offers (Authentication and mobile verification required - needed to know if user already used a coupon)
router.get('/events/:eventId/offers', authenticate, requireMobileVerification, asyncHandler(getEventOffers));

// Sponsors (Public route - no authentication required)
router.get('/sponsors/:id', asyncHandler(getSponsorByIdForUsers));

module.exports = router;

