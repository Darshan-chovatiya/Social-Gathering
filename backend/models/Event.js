const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const ticketTypeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event.slots',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  banners: [{
    type: String, // URLs to images/videos
  }],
  eventImages: [{
    type: String, // URLs to event images
  }],
  eventDetailImage: {
    type: String, // URL to event detail image
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  }],
  sponsors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor',
  }],
  slots: [slotSchema],
  ticketTypes: [ticketTypeSchema],
  duration: {
    type: Number, // in hours
    required: true,
  },
  address: {
    fullAddress: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  organizer: {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    contactInfo: {
      type: String,
      required: true,
    },
  },
  notes: {
    type: String,
  },
  termsAndConditions: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
  isFeatured: {
    type: Boolean,
    default: false,
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
  approvedAt: {
    type: Date,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  paymentConfig: {
    gateway: { 
      type: String, 
      enum: ['razorpay', 'cashfree', 'ccavenue'], 
      default: 'razorpay' 
    },
    razorpay: {
      keyId: { type: String },
      keySecret: { type: String }
    },
    cashfree: {
      appId: { type: String },
      secretKey: { type: String }
    },
    ccavenue: {
      merchantId: { type: String },
      accessCode: { type: String },
      workingKey: { type: String }
    }
  },
});

// Indexes
eventSchema.index({ status: 1, isActive: 1 });
eventSchema.index({ categories: 1 });
eventSchema.index({ sponsors: 1 });
eventSchema.index({ 'organizer.organizerId': 1 });
eventSchema.index({ createdAt: -1 });

eventSchema.pre('save', async function() {
  if (this.isModified() || this.isNew) {
    this.updatedAt = Date.now();
  }
  if (this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = Date.now();
  }
});

module.exports = mongoose.model('Event', eventSchema);

