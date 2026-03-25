const { body } = require('express-validator');

const sendOTPValidation = [
  body('mobile')
    .isMobilePhone('en-IN')
    .withMessage('Valid mobile number is required'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),
];

const verifyOTPValidation = [
  body('mobile')
    .isMobilePhone('en-IN')
    .withMessage('Valid mobile number is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
];

const googleSignInValidation = [
  body('idToken')
    .notEmpty()
    .withMessage('Google ID token is required'),
  body('mobile')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Valid mobile number is required'),
];

module.exports = {
  sendOTPValidation,
  verifyOTPValidation,
  googleSignInValidation,
};

