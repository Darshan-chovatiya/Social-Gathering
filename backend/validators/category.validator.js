const { body } = require('express-validator');

const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required'),
  body('description')
    .optional()
    .trim(),
];

const updateCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty'),
  body('description')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
};

