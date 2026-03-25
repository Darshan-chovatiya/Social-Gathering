const mongoose = require('mongoose');
const QRCode = require('qrcode');

const ticketSchema = new mongoose.Schema({
  ticketTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  ticketTypeTitle: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  slotDate: {
    type: Date,
    required: true,
  },
  slotStartTime: {
    type: String,
    required: true,
  },
  slotEndTime: {
    type: String,
    required: true,
  },
  tickets: [ticketSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending',
  },
  qrCode: {
    type: String, // Base64 or URL
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  cancelledAt: {
    type: Date,
  },
  cancellationReason: {
    type: String,
  },
  affiliateLinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AffiliateLink',
  },
  isAttended: {
    type: Boolean,
    default: false,
  },
  attendedAt: {
    type: Date,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Indexes (bookingId already has unique index from unique: true)
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ affiliateLinkId: 1 });
bookingSchema.index({ isAttended: 1 });

// Generate QR Code before saving
bookingSchema.pre('save', async function() {
  // Generate QR code for new bookings with success payment status, or when payment status changes to success
  if ((this.isNew && this.paymentStatus === 'success') || (this.isModified('paymentStatus') && this.paymentStatus === 'success' && !this.qrCode)) {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://easytickets.in';
      const qrDataUrl = `${baseUrl}/tickets/${this.bookingId}/download`;
      this.qrCode = await QRCode.toDataURL(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  if (this.isModified() || this.isNew) {
    this.updatedAt = Date.now();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);

