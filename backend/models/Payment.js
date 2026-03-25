const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  razorpayOrderId: {
    type: String,
    sparse: true,
  },
  razorpayPaymentId: {
    type: String,
    sparse: true,
  },
  razorpaySignature: {
    type: String,
  },
  cashfreeOrderId: {
    type: String,
    sparse: true,
  },
  cashfreePaymentId: {
    type: String,
    sparse: true,
  },
  gateway: {
    type: String,
    enum: ['razorpay', 'cashfree', 'ccavenue', 'free', 'dummy'],
    default: 'razorpay',
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'bookingModel'
  },
  bookingModel: {
    type: String,
    required: true,
    enum: ['Booking', 'FarmhouseBooking'],
    default: 'Booking'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'dummy', 'free'],
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending',
  },
  failureReason: {
    type: String,
  },
  refundId: {
    type: String,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundedAt: {
    type: Date,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
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

// Indexes (razorpayOrderId already has unique index from unique: true)
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ status: 1 });

paymentSchema.pre('save', async function() {
  if (this.isModified() || this.isNew) {
    this.updatedAt = Date.now();
  }
});

module.exports = mongoose.model('Payment', paymentSchema);

