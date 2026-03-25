const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  maxDiscount: {
    type: Number, // For percentage discounts
    min: 0,
  },
  minPurchaseAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'organizer'],
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    sparse: true, // Can be null for global offers
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    sparse: true, // Can be null for event-specific offers
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    sparse: true, // Optional slot-based offer
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageLimit: {
    type: Number, // Total number of times offer can be used
    default: null, // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  perCustomerLimit: {
    type: Number, // Maximum number of times a single customer can use this offer
    default: 1, // Default is 1 (each customer can use once)
    min: 1,
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
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

// Indexes (code already has unique index from unique: true)
offerSchema.index({ eventId: 1, isActive: 1 });
offerSchema.index({ categoryId: 1, isActive: 1 });
offerSchema.index({ validFrom: 1, validUntil: 1 });

offerSchema.pre('save', async function() {
  if (this.isModified() || this.isNew) {
    this.updatedAt = Date.now();
  }
  if (this.code && this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
});

module.exports = mongoose.model('Offer', offerSchema);

