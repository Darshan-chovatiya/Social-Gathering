/**
 * Mobile API - Organizer routes
 * Base path: /api/mobile/organizers
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { createUserValidation } = require('../../validators/admin.validator');
const { addOrganizer } = require('../../controllers/mobile/organizer.controller');

// Configure multer for user profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/users/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'organizer-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
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

/**
 * @route   POST /api/mobile/organizers
 * @desc    Add a new organizer
 * @access  Public
 */
router.post(
  '/',
  upload.single('profilePicture'),
  createUserValidation,
  validate,
  asyncHandler(addOrganizer)
);

module.exports = router;
