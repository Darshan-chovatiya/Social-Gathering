const { body } = require('express-validator');

const createEventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Event description is required'),
  body('categories')
    .custom((value) => {
      // Handle both array and JSON string
      let categories = value;
      if (typeof value === 'string') {
        try {
          categories = JSON.parse(value);
        } catch (e) {
          return false;
        }
      }
      return Array.isArray(categories) && categories.length > 0;
    })
    .withMessage('At least one category is required'),
  body('duration')
    .isNumeric()
    .withMessage('Event duration is required'),
  body('address')
    .custom((value) => {
      // Handle both object and JSON string
      let address = value;
      if (typeof value === 'string') {
        try {
          address = JSON.parse(value);
        } catch (e) {
          return false;
        }
      }
      if (!address || typeof address !== 'object') return false;
      if (!address.fullAddress || !address.fullAddress.trim()) return false;
      if (!address.city || !address.city.trim()) return false;
      if (!address.state || !address.state.trim()) return false;
      if (!address.pincode || !address.pincode.trim()) return false;
      return true;
    })
    .withMessage('Address fields (fullAddress, city, state, pincode) are required'),
  body('organizer')
    .custom((value) => {
      // Handle both object and JSON string
      let organizer = value;
      if (typeof value === 'string') {
        try {
          organizer = JSON.parse(value);
        } catch (e) {
          return false;
        }
      }
      if (!organizer || typeof organizer !== 'object') return false;
      if (!organizer.name || !organizer.name.trim()) return false;
      if (!organizer.contactInfo || !organizer.contactInfo.trim()) return false;
      return true;
    })
    .withMessage('Organizer name and contact info are required'),
  body('termsAndConditions')
    .trim()
    .notEmpty()
    .withMessage('Terms and conditions are required'),
];

module.exports = {
  createEventValidation,
};

