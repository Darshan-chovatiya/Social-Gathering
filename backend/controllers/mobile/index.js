/**
 * Mobile API - Controllers index (customer panel / mobile app)
 */
const auth = require('./auth.controller');
const publicCtrl = require('./public.controller');
const user = require('./user.controller');
const bookings = require('./bookings.controller');
const payments = require('./payments.controller');
const affiliate = require('./affiliate.controller');

module.exports = {
  auth,
  public: publicCtrl,
  user,
  bookings,
  payments,
  affiliate,
};
