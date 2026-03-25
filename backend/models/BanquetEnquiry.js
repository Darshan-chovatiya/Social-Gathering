const mongoose = require('mongoose');

const banquetEnquirySchema = new mongoose.Schema({
  banquetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Banquet',
    required: true,
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for guest enquiries
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

module.exports = mongoose.model('BanquetEnquiry', banquetEnquirySchema);
