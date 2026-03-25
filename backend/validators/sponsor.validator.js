const { body } = require('express-validator');

const createSponsorValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Sponsor name is required'),
  body('type')
    .isIn(['sponsor', 'co-sponsor', 'title sponsor', 'supported by', 'community partner', 'technology partner', 'social media partner'])
    .withMessage('Invalid sponsor type'),
  body('website')
    .optional({ checkFalsy: true })
    .if(body('website').notEmpty())
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('socialMedia')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty/null
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed !== 'object' || parsed === null) return false;
          // Validate URLs in parsed object
          const urlFields = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
          for (const field of urlFields) {
            if (parsed[field] && parsed[field].trim()) {
              try {
                new URL(parsed[field]);
              } catch (e) {
                return false;
              }
            }
          }
          return true;
        } catch (e) {
          return false;
        }
      }
      if (typeof value === 'object' && value !== null) {
        // Validate URLs in object
        const urlFields = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
        for (const field of urlFields) {
          if (value[field] && value[field].trim()) {
            try {
              new URL(value[field]);
            } catch (e) {
              return false;
            }
          }
        }
        return true;
      }
      return false;
    })
    .withMessage('Social media must be a valid object with valid URLs'),
];

const updateSponsorValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Sponsor name cannot be empty'),
  body('type')
    .optional()
    .isIn(['sponsor', 'co-sponsor', 'title sponsor', 'supported by', 'community partner', 'technology partner', 'social media partner'])
    .withMessage('Invalid sponsor type'),
  body('website')
    .optional({ checkFalsy: true })
    .if(body('website').notEmpty())
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('socialMedia')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty/null
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed !== 'object' || parsed === null) return false;
          // Validate URLs in parsed object
          const urlFields = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
          for (const field of urlFields) {
            if (parsed[field] && parsed[field].trim()) {
              try {
                new URL(parsed[field]);
              } catch (e) {
                return false;
              }
            }
          }
          return true;
        } catch (e) {
          return false;
        }
      }
      if (typeof value === 'object' && value !== null) {
        // Validate URLs in object
        const urlFields = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
        for (const field of urlFields) {
          if (value[field] && value[field].trim()) {
            try {
              new URL(value[field]);
            } catch (e) {
              return false;
            }
          }
        }
        return true;
      }
      return false;
    })
    .withMessage('Social media must be a valid object with valid URLs'),
];

module.exports = {
  createSponsorValidation,
  updateSponsorValidation,
};
