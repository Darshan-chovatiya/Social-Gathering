/**
 * Mobile API - User routes (auth required) for customer panel
 * Profile, upcoming events, events list/detail/banners, categories, offers, sponsors
 * Mounted at: /api/mobile/user
 */
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
  getUpcomingEvents,
  getActiveBanners,
  getEvents,
  getEventById,
  getFeaturedEvents,
  getCategories,
  getEventOffers,
  getSponsorByIdForUsers,
} = require('../../controllers/mobile/user.controller');

const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/users/';
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  },
});

// All routes below require authentication
router.use(authenticate);

// ---- Profile ----
router.get('/profile', asyncHandler(getProfile));
router.put('/profile', uploadUserImage.single('profilePicture'), updateProfileValidation, validate, asyncHandler(updateProfile));
router.put('/change-password', changePasswordValidation, validate, asyncHandler(changePassword));

// ---- Upcoming events (mobile verified) ----
router.get('/upcoming-events', requireMobileVerification, asyncHandler(getUpcomingEvents));

// ---- Banners (active) ----
router.get('/banners/active', asyncHandler(getActiveBanners));

// ---- Events (for customer panel - with future slot filter) ----
router.get('/events/featured', asyncHandler(getFeaturedEvents));
router.get('/events', asyncHandler(getEvents));
router.get('/events/:id', asyncHandler(getEventById));

// ---- Categories ----
router.get('/categories', asyncHandler(getCategories));

// ---- Offers for event (with isAlreadyUsed for logged-in user) ----
router.get('/events/:eventId/offers', requireMobileVerification, asyncHandler(getEventOffers));

// ---- Sponsors (single sponsor for users) ----
router.get('/sponsors/:id', asyncHandler(getSponsorByIdForUsers));

module.exports = router;
