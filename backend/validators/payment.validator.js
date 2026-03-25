const { body } = require('express-validator');

const createOrderValidation = [
  body()
    .custom((value) => {
      if (!value.bookingId && !value.bookingData) {
        throw new Error('Either bookingId or bookingData is required');
      }
      return true;
    }),
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number'),
];

const verifyPaymentValidation = [
  body()
    .custom((value) => {
      // Razorpay
      if (value.razorpay_order_id) {
        if (!value.razorpay_payment_id || !value.razorpay_signature) {
          throw new Error('Razorpay payment ID and signature are required');
        }
        return true;
      }
      
      // Cashfree
      if (value.order_id || value.cf_order_id) {
        return true;
      }
      
      throw new Error('Order ID is required');
    }),
];

const storePaymentValidation = [
  // Accept either bookingId OR bookingData
  body()
    .custom((value, { req }) => {
      if (!value.bookingId && !value.bookingData) {
        throw new Error('Either bookingId or bookingData is required');
      }
      // If bookingData is provided, validate its required fields
      if (value.bookingData) {
        if (!value.bookingData.eventId && !value.bookingData.farmhouseId) {
          throw new Error('Event ID or Farmhouse ID is required in bookingData');
        }
        if (value.bookingData.eventId) {
          if (!value.bookingData.slotId) {
            throw new Error('Slot ID is required in bookingData for event bookings');
          }
          if (!Array.isArray(value.bookingData.tickets) || value.bookingData.tickets.length === 0) {
            throw new Error('Tickets array is required and must not be empty in bookingData');
          }
        }
      }
      return true;
    }),
  // Validate amount first to determine if it's a free booking
  body('amount')
    .custom((value) => {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Amount must be a non-negative number');
      }
      return true;
    })
    .withMessage('Amount must be a non-negative number'),
  // Razorpay payment ID is required only for paid bookings (amount > 0)
  body('razorpay_payment_id')
    .custom((value, { req }) => {
      const amount = typeof req.body.amount === 'string' ? parseFloat(req.body.amount) : req.body.amount;
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      const isFreeBooking = numAmount === 0 || numAmount === '0' || parseFloat(numAmount) === 0;
      
      // For free bookings, payment ID is optional (can be null, undefined, or empty)
      if (isFreeBooking) {
        return true;
      }
      
      // For paid bookings, payment ID is required
      if (!value || value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        throw new Error('Razorpay payment ID is required for paid bookings');
      }
      return true;
    }),
  body('razorpay_order_id')
    .optional(),
  body('razorpay_signature')
    .optional(),
];

module.exports = {
  createOrderValidation,
  verifyPaymentValidation,
  storePaymentValidation,
};

