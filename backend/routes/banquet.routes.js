const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  createBanquet,
  updateBanquet,
  getMyBanquets,
  getAllBanquets,
  getBanquetById,
  deleteBanquet
} = require('../controllers/banquet.controller');

const {
  createEnquiry,
  getOrganizerEnquiries,
  updateEnquiryStatus
} = require('../controllers/banquetEnquiry.controller');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/banquets/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banquet-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Public routes
router.get('/public', asyncHandler(getAllBanquets));
router.get('/public/:id', asyncHandler(getBanquetById));
router.post('/enquiry', asyncHandler(createEnquiry));

// Organizer routes
router.get('/organizer', authenticate, authorize('organizer'), asyncHandler(getMyBanquets));
router.post('/organizer', authenticate, authorize('organizer'), upload.fields([
  { name: 'banners', maxCount: 10 },
  { name: 'banquetImages', maxCount: 20 }
]), asyncHandler(createBanquet));
router.put('/organizer/:id', authenticate, authorize('organizer'), upload.fields([
  { name: 'banners', maxCount: 10 },
  { name: 'banquetImages', maxCount: 20 }
]), asyncHandler(updateBanquet));
router.delete('/organizer/:id', authenticate, authorize('organizer'), asyncHandler(deleteBanquet));
router.get('/organizer/enquiries', authenticate, authorize('organizer'), asyncHandler(getOrganizerEnquiries));
router.put('/organizer/enquiries/:id', authenticate, authorize('organizer'), asyncHandler(updateEnquiryStatus));

module.exports = router;
