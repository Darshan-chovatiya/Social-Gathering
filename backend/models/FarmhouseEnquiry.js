const mongoose = require('mongoose');

const farmhouseEnquirySchema = new mongoose.Schema({
  farmhouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmhouse',
    required: true,
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'attended', 'replied'],
    default: 'pending',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FarmhouseEnquiry', farmhouseEnquirySchema);
