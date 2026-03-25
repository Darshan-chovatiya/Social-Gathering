const { body } = require('express-validator');

const createOfferValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Offer title is required'),
  body('type')
    .isIn(['flat', 'percentage'])
    .withMessage('Offer type must be flat or percentage'),
  body('value')
    .isNumeric()
    .withMessage('Offer value is required'),
  body('validFrom')
    .isISO8601()
    .withMessage('Valid from date is required'),
  body('validUntil')
    .isISO8601()
    .withMessage('Valid until date is required'),
  body('minPurchaseAmount')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty values
      }
      return !isNaN(parseFloat(value));
    })
    .withMessage('Min purchase amount must be a number'),
  body('usageLimit')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty values
      }
      const num = parseInt(value);
      return !isNaN(num) && num > 0;
    })
    .withMessage('Usage limit must be a positive integer'),
  body('perCustomerLimit')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty values (will default to 1)
      }
      const num = parseInt(value);
      return !isNaN(num) && num > 0;
    })
    .withMessage('Per customer limit must be a positive integer'),
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Offer code cannot be empty'),
];

module.exports = {
  createOfferValidation,
};

