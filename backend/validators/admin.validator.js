const { body } = require('express-validator');

const updateUserStatusValidation = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updateUserRoleValidation = [
  body('role')
    .isIn(['user', 'organizer', 'admin'])
    .withMessage('Invalid role'),
];

const rejectEventValidation = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required'),
];

const featureEventValidation = [
  body('isFeatured')
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
];

const adminLoginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const createUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile number must be 10 digits'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['user', 'organizer', 'admin'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('mobile')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Mobile number cannot be empty')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile number must be 10 digits'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

module.exports = {
  updateUserStatusValidation,
  updateUserRoleValidation,
  rejectEventValidation,
  featureEventValidation,
  adminLoginValidation,
  createUserValidation,
  updateUserValidation,
};
