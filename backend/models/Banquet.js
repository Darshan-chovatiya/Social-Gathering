const mongoose = require('mongoose');

const banquetSchema = new mongoose.Schema({
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
    type: String,
  }],
  banquetImages: [{
    type: String,
  }],
  amenities: [{
    name: String,
    available: { type: Boolean, default: true }
  }],
  venues: [{
    name: { type: String, required: true }, // e.g., Hall, Poolside, Lawn
    seatingCapacity: { type: Number, default: 0 },
    floatingCapacity: { type: Number, default: 0 },
  }],
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
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Banquet', banquetSchema);
