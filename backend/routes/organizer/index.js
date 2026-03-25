const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { createEventValidation } = require('../../validators/event.validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getAllEvents,
  getFeaturedEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../../controllers/event.controller');
const {
  getMyEvents,
  getAllBookings,
  getEventBookings,
  getEventStats,
  addPhysicalTickets,
  scanTicket,
  getScannedTickets,
} = require('../../controllers/organizer.controller');
const {
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} = require('../../controllers/offer.controller');
const { createOfferValidation } = require('../../validators/offer.validator');
const {
  getAllSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} = require('../../controllers/sponsor.controller');
const { createSponsorValidation, updateSponsorValidation } = require('../../validators/sponsor.validator');

// All routes require organizer authentication
router.use(authenticate);
router.use(authorize('organizer'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/events/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Allowed file extensions (case insensitive)
    const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|mp4|mov|avi)$/i;
    // Allowed MIME types
    const allowedMimeTypes = /^(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|mov|avi))$/i;
    
    const extname = allowedExtensions.test(path.extname(file.originalname));
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed'));
  },
});

// Middleware to parse JSON strings from FormData before validation
const parseFormDataJson = (req, res, next) => {
  try {
    // Parse JSON string fields if they exist
    if (req.body.categories && typeof req.body.categories === 'string') {
      req.body.categories = JSON.parse(req.body.categories);
    }
    if (req.body.address && typeof req.body.address === 'string') {
      req.body.address = JSON.parse(req.body.address);
    }
    if (req.body.organizer && typeof req.body.organizer === 'string') {
      req.body.organizer = JSON.parse(req.body.organizer);
    }
    if (req.body.slots && typeof req.body.slots === 'string') {
      req.body.slots = JSON.parse(req.body.slots);
    }
    if (req.body.ticketTypes && typeof req.body.ticketTypes === 'string') {
      req.body.ticketTypes = JSON.parse(req.body.ticketTypes);
    }
    // Handle existingBanners array from FormData
    if (req.body.existingBanners) {
      if (typeof req.body.existingBanners === 'string') {
        try {
          req.body.existingBanners = JSON.parse(req.body.existingBanners);
        } catch (e) {
          // If it's not JSON, it might be a single value or array from FormData
          req.body.existingBanners = Array.isArray(req.body.existingBanners) 
            ? req.body.existingBanners 
            : [req.body.existingBanners];
        }
      }
    }
    // Handle existingEventImages array from FormData
    if (req.body.existingEventImages) {
      if (typeof req.body.existingEventImages === 'string') {
        try {
          req.body.existingEventImages = JSON.parse(req.body.existingEventImages);
        } catch (e) {
          req.body.existingEventImages = Array.isArray(req.body.existingEventImages) 
            ? req.body.existingEventImages 
            : [req.body.existingEventImages];
        }
      }
    }
    // Handle existingEventDetailImage from FormData
    if (req.body.existingEventDetailImage && typeof req.body.existingEventDetailImage === 'string') {
      // Keep as string, no parsing needed
      req.body.existingEventDetailImage = req.body.existingEventDetailImage;
    }
    // Handle sponsors array from FormData
    if (req.body.sponsors && typeof req.body.sponsors === 'string') {
      try {
        req.body.sponsors = JSON.parse(req.body.sponsors);
      } catch (e) {
        req.body.sponsors = Array.isArray(req.body.sponsors) 
          ? req.body.sponsors 
          : [req.body.sponsors];
      }
    }
    next();
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: 'Invalid JSON format in form data',
      result: null
    });
  }
};

// Event Management Routes
router.get('/events', asyncHandler(getMyEvents));
router.post('/events', upload.fields([
  { name: 'banners', maxCount: 10 },
  { name: 'eventImages', maxCount: 20 },
  { name: 'eventDetailImage', maxCount: 1 }
]), parseFormDataJson, createEventValidation, validate, asyncHandler(createEvent));
router.get('/events/:id', asyncHandler(getEventById));
router.put('/events/:id', upload.fields([
  { name: 'banners', maxCount: 10 },
  { name: 'eventImages', maxCount: 20 },
  { name: 'eventDetailImage', maxCount: 1 }
]), parseFormDataJson, asyncHandler(updateEvent));
router.delete('/events/:id', asyncHandler(deleteEvent));

// Event Bookings & Stats
router.get('/bookings', asyncHandler(getAllBookings));
router.get('/events/:eventId/bookings', asyncHandler(getEventBookings));
router.get('/events/:eventId/stats', asyncHandler(getEventStats));
router.post('/events/:eventId/add-physical-tickets', asyncHandler(addPhysicalTickets));

// Ticket Scanning
router.post('/scan-ticket', asyncHandler(scanTicket));
router.get('/scanned-tickets', asyncHandler(getScannedTickets));

// Offer Management (for organizer's events)
router.get('/offers', asyncHandler(getAllOffers));
router.post('/offers', createOfferValidation, validate, asyncHandler(createOffer));
router.put('/offers/:id', asyncHandler(updateOffer));
router.delete('/offers/:id', asyncHandler(deleteOffer));

// Sponsor Management
// Ensure uploads directory exists for sponsors
const sponsorUploadsDir = path.join(__dirname, '../../uploads/sponsors');
if (!fs.existsSync(sponsorUploadsDir)) {
  fs.mkdirSync(sponsorUploadsDir, { recursive: true });
}

// Configure multer for sponsor logo uploads
const sponsorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, sponsorUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sponsor-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadSponsorLogo = multer({
  storage: sponsorStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
  },
});

router.get('/sponsors', asyncHandler(getAllSponsors));
router.get('/sponsors/:id', asyncHandler(getSponsorById));
router.post('/sponsors', uploadSponsorLogo.single('logo'), createSponsorValidation, validate, asyncHandler(createSponsor));
router.put('/sponsors/:id', uploadSponsorLogo.single('logo'), updateSponsorValidation, validate, asyncHandler(updateSponsor));
router.delete('/sponsors/:id', asyncHandler(deleteSponsor));

module.exports = router;

