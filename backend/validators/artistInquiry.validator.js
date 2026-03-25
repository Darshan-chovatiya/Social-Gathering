const { body } = require('express-validator');

const createArtistInquiryValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 120 })
    .withMessage('Full name must be at most 120 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email is too long'),
  body('countryCode')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{0,3}$/)
    .withMessage('Invalid country code'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{7,15}$/)
    .withMessage('Phone number must be 7–15 digits'),
  body('organizationName')
    .trim()
    .notEmpty()
    .withMessage('Organisation name is required')
    .isLength({ max: 200 })
    .withMessage('Organisation name must be at most 200 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be at most 100 characters'),
];

const updateArtistInquiryValidation = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Full name must be at most 120 characters'),
  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email is too long'),
  body('countryCode')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{0,3}$/)
    .withMessage('Invalid country code'),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .matches(/^[0-9]{7,15}$/)
    .withMessage('Phone number must be 7–15 digits'),
  body('organizationName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organisation name cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Organisation name must be at most 200 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be at most 100 characters'),
  body('status')
    .optional()
    .isIn(['new', 'read', 'archived'])
    .withMessage('Status must be one of: new, read, archived'),
];

module.exports = {
  createArtistInquiryValidation,
  updateArtistInquiryValidation,
};
