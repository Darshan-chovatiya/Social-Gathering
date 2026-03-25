const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const {
  updateUserStatusValidation,
  updateUserRoleValidation,
  rejectEventValidation,
  featureEventValidation,
  createUserValidation,
  updateUserValidation,
} = require('../../validators/admin.validator');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserRole,
  getPendingEvents,
  approveEvent,
  rejectEvent,
  featureEvent,
  getAllEvents,
  createEvent,
  updateEvent,
} = require('../../controllers/admin.controller');
const {
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../../controllers/category.controller');
const {
  createCategoryValidation,
  updateCategoryValidation,
} = require('../../validators/category.validator');
const {
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} = require('../../controllers/offer.controller');
const { createOfferValidation } = require('../../validators/offer.validator');
const {
  createArtistInquiryValidation,
  updateArtistInquiryValidation,
} = require('../../validators/artistInquiry.validator');
const {
  getAllArtistInquiriesAdmin,
  getArtistInquiryByIdAdmin,
  createArtistInquiryAdmin,
  updateArtistInquiryAdmin,
  deleteArtistInquiryAdmin,
} = require('../../controllers/artistInquiry.admin.controller');
const {
  getAllSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} = require('../../controllers/sponsor.controller');
const { createSponsorValidation, updateSponsorValidation } = require('../../validators/sponsor.validator');
const {
  getEventWiseBookings,
  getRevenueReport,
  getCategoryWiseSales,
  getUserEngagement,
} = require('../../controllers/report.controller');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Configure multer for user profile picture uploads
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/users/');
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

// User Management Routes
router.get('/users', asyncHandler(getAllUsers));
router.post('/users', uploadUserImage.single('profilePicture'), createUserValidation, validate, asyncHandler(createUser));
router.put('/users/:id', uploadUserImage.single('profilePicture'), updateUserValidation, validate, asyncHandler(updateUser));
router.delete('/users/:id', asyncHandler(deleteUser));
router.put('/users/:id/status', updateUserStatusValidation, validate, asyncHandler(updateUserStatus));
router.put('/users/:id/role', updateUserRoleValidation, validate, asyncHandler(updateUserRole));

// Configure multer for event banner uploads
const eventStorage = multer.diskStorage({
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

const uploadEventBanners = multer({
  storage: eventStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    // Allowed file extensions (case insensitive)
    const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;
    // Allowed MIME types
    const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp)$/i;
    
    const extname = allowedExtensions.test(path.extname(file.originalname));
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
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
router.get('/events', asyncHandler(getAllEvents));
router.get('/events/pending', asyncHandler(getPendingEvents));
router.post('/events', uploadEventBanners.fields([
  { name: 'banners', maxCount: 10 },
  { name: 'eventImages', maxCount: 20 },
  { name: 'eventDetailImage', maxCount: 1 }
]), parseFormDataJson, asyncHandler(createEvent));
router.put('/events/:id', uploadEventBanners.fields([
  { name: 'banners', maxCount: 10 },
  { name: 'eventImages', maxCount: 20 },
  { name: 'eventDetailImage', maxCount: 1 }
]), parseFormDataJson, asyncHandler(updateEvent));
router.put('/events/:id/approve', asyncHandler(approveEvent));
router.put('/events/:id/reject', rejectEventValidation, validate, asyncHandler(rejectEvent));
router.put('/events/:id/feature', featureEventValidation, validate, asyncHandler(featureEvent));

// Configure multer for category image uploads
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/categories/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadCategoryImage = multer({
  storage: categoryStorage,
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

// Category Management Routes
router.get('/categories', asyncHandler(getAllCategoriesAdmin));
router.post('/categories', uploadCategoryImage.single('image'), createCategoryValidation, validate, asyncHandler(createCategory));
router.put('/categories/:id', uploadCategoryImage.single('image'), updateCategoryValidation, validate, asyncHandler(updateCategory));
router.delete('/categories/:id', asyncHandler(deleteCategory));

// Offer Management Routes (Global/Category offers)
router.get('/offers', asyncHandler(getAllOffers));
router.post('/offers', createOfferValidation, validate, asyncHandler(createOffer));
router.put('/offers/:id', asyncHandler(updateOffer));
router.delete('/offers/:id', asyncHandler(deleteOffer));

// Artist Inquiry Management Routes
router.get('/artist-inquiries', asyncHandler(getAllArtistInquiriesAdmin));
router.get('/artist-inquiries/:id', asyncHandler(getArtistInquiryByIdAdmin));
router.post('/artist-inquiries', createArtistInquiryValidation, validate, asyncHandler(createArtistInquiryAdmin));
router.put('/artist-inquiries/:id', updateArtistInquiryValidation, validate, asyncHandler(updateArtistInquiryAdmin));
router.delete('/artist-inquiries/:id', asyncHandler(deleteArtistInquiryAdmin));

// Sponsor Management Routes
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

// Reports Routes
router.get('/reports/event-wise-bookings', asyncHandler(getEventWiseBookings));
router.get('/reports/revenue', asyncHandler(getRevenueReport));
router.get('/reports/category-wise-sales', asyncHandler(getCategoryWiseSales));
router.get('/reports/user-engagement', asyncHandler(getUserEngagement));

module.exports = router;

