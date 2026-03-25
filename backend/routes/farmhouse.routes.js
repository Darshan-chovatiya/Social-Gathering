const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  createFarmhouse,
  updateFarmhouse,
  getMyFarmhouses,
  getAllFarmhouses,
  getFarmhouseById,
  deleteFarmhouse
} = require('../controllers/farmhouse.controller');

const {
  checkAvailability,
  calculateTotalPrice,
  createBooking,
  getMyBookings,
  getOrganizerBookings,
  getBookingById
} = require('../controllers/farmhouseBooking.controller');

const {
  createEnquiry,
  getOrganizerEnquiries,
  updateEnquiryStatus
} = require('../controllers/farmhouseEnquiry.controller');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/farmhouses/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'farmhouse-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const parseFormDataJson = (req, res, next) => {
  try {
    if (req.body.amenities && typeof req.body.amenities === 'string') req.body.amenities = JSON.parse(req.body.amenities);
    if (req.body.pricing && typeof req.body.pricing === 'string') req.body.pricing = JSON.parse(req.body.pricing);
    if (req.body.deposit && typeof req.body.deposit === 'string') req.body.deposit = JSON.parse(req.body.deposit);
    if (req.body.address && typeof req.body.address === 'string') req.body.address = JSON.parse(req.body.address);
    if (req.body.organizer && typeof req.body.organizer === 'string') req.body.organizer = JSON.parse(req.body.organizer);
    if (req.body.paymentConfig && typeof req.body.paymentConfig === 'string') req.body.paymentConfig = JSON.parse(req.body.paymentConfig);
    if (req.body.existingBanners && typeof req.body.existingBanners === 'string') req.body.existingBanners = JSON.parse(req.body.existingBanners);
    if (req.body.existingFarmhouseImages && typeof req.body.existingFarmhouseImages === 'string') req.body.existingFarmhouseImages = JSON.parse(req.body.existingFarmhouseImages);
    next();
  } catch (e) {
    next();
  }
};

// Public routes (Customers)
router.get('/public', asyncHandler(getAllFarmhouses));
router.get('/public/:id', asyncHandler(getFarmhouseById));
router.get('/check-availability', asyncHandler(checkAvailability));
router.post('/enquiry', asyncHandler(createEnquiry));

// Protected Customer routes
router.post('/calculate-price', authenticate, asyncHandler(calculateTotalPrice));
router.post('/bookings', authenticate, asyncHandler(createBooking));
router.get('/my-bookings', authenticate, asyncHandler(getMyBookings));
router.get('/bookings/:bookingId', authenticate, asyncHandler(getBookingById));

// Organizer routes
router.get('/organizer', authenticate, authorize('organizer'), asyncHandler(getMyFarmhouses));
router.post('/organizer', authenticate, authorize('organizer'), upload.fields([
  { name: 'banners', maxCount: 10 },
  { name: 'farmhouseImages', maxCount: 20 },
  { name: 'farmhouseDetailImage', maxCount: 1 }
]), parseFormDataJson, asyncHandler(createFarmhouse));
router.put('/organizer/:id', authenticate, authorize('organizer'), upload.fields([
  { name: 'banners', maxCount: 10 },
  { name: 'farmhouseImages', maxCount: 20 },
  { name: 'farmhouseDetailImage', maxCount: 1 }
]), parseFormDataJson, asyncHandler(updateFarmhouse));
router.delete('/organizer/:id', authenticate, authorize('organizer'), asyncHandler(deleteFarmhouse));
router.get('/organizer/bookings', authenticate, authorize('organizer'), asyncHandler(getOrganizerBookings));
router.get('/organizer/enquiries', authenticate, authorize('organizer'), asyncHandler(getOrganizerEnquiries));
router.put('/organizer/enquiries/:id', authenticate, authorize('organizer'), asyncHandler(updateEnquiryStatus));

module.exports = router;
