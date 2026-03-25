const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/**
 * Middleware to validate request data
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => `${err.param}: ${err.msg}`);
    return sendError(res, 'Validation failed', 400, { errors: errorMessages });
  }
  next();
};

module.exports = validate;

