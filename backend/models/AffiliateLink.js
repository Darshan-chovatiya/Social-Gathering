const mongoose = require('mongoose');
const crypto = require('crypto');

const affiliateLinkSchema = new mongoose.Schema({
  affiliateCode: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true,
  },
  referrerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    // Not unique - same customer can have multiple bookings for same event, but only one affiliate link
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes (affiliateCode already has unique index from unique: true)
affiliateLinkSchema.index({ referrerUserId: 1, eventId: 1 }, { unique: true }); // One link per customer per event
affiliateLinkSchema.index({ eventId: 1 });
affiliateLinkSchema.index({ bookingId: 1 }); // Not unique anymore

module.exports = mongoose.model('AffiliateLink', affiliateLinkSchema);

