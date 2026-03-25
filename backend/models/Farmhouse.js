const mongoose = require('mongoose');

const farmhouseSchema = new mongoose.Schema({
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
  farmhouseImages: [{
    type: String, // URLs to farmhouse images
  }],
  farmhouseDetailImage: {
    type: String, // URL to farmhouse detail image
  },
  amenities: {
    guests: { type: Number, default: 0 },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    pool: { type: Boolean, default: false },
    lawn: { type: Boolean, default: false },
    bbq: { type: Boolean, default: false },
    ac: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    kitchen: { type: Boolean, default: false },
    tv: { type: Boolean, default: false },
    musicSystem: { type: Boolean, default: false },
    extraAmenities: [{
      name: String,
      available: { type: Boolean, default: true }
    }]
  },
  pricing: {
    regular: {
      rate12h: { type: Number, default: 0 },
      rate24h: { type: Number, default: 0 },
      perNight: { type: Number, default: 0 },
    },
    weekend: {
      rate12h: { type: Number, default: 0 },
      rate24h: { type: Number, default: 0 },
      perNight: { type: Number, default: 0 },
    },
    festival: {
      rate12h: { type: Number, default: 0 },
      rate24h: { type: Number, default: 0 },
      perNight: { type: Number, default: 0 },
    },
  },
  festivalDates: [{ type: Date }],
  deposit: {
    description: { type: String },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    value: { type: Number, default: 0 }
  },
  checkInTime: {
    type: String, // e.g., "14:00"
    required: true,
  },
  checkOutTime: {
    type: String, // e.g., "11:00"
    required: true,
  },
  address: {
    fullAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  organizer: {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true },
    contactInfo: { type: String, required: true },
  },
  notes: { type: String },
  termsAndConditions: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  isActive: {
    type: Boolean,
    default: true,
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
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Farmhouse', farmhouseSchema);
