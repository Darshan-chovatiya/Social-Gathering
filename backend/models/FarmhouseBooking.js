const mongoose = require('mongoose');

const farmhouseBookingSchema = new mongoose.Schema({
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
  farmhouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmhouse',
    required: true,
  },
  checkInDate: {
    type: Date,
    required: true,
  },
  checkOutDate: {
    type: Date,
    required: true,
  },
  checkInTime: {
    type: String,
    required: true,
  },
  checkOutTime: {
    type: String,
    required: true,
  },
  selectedPricing: {
    tier: { type: String, enum: ['regular', 'weekend', 'festival'] },
    rateType: { type: String, enum: ['rate12h', 'rate24h', 'perNight'] },
    rate: { type: Number }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  depositAmount: {
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
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'processed'],
    default: 'none'
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('FarmhouseBooking', farmhouseBookingSchema);
