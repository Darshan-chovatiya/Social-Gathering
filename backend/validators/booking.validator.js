const { body } = require('express-validator');

const createBookingValidation = [
  body('eventId')
    .notEmpty()
    .withMessage('Event ID is required'),
  body('slotId')
    .notEmpty()
    .withMessage('Slot ID is required'),
  body('tickets')
    .isArray({ min: 1 })
    .withMessage('At least one ticket is required'),
  body('tickets.*.ticketTypeId')
    .notEmpty()
    .withMessage('Ticket type ID is required'),
  body('tickets.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Valid quantity is required'),
  body('offerCode')
    .optional()
    .trim(),
];

const cancelBookingValidation = [
  body('reason')
    .optional()
    .trim(),
];

module.exports = {
  createBookingValidation,
  cancelBookingValidation,
};

