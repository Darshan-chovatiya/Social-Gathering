const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
    type: String, // URL to logo image
    required: true,
  },
  type: {
    type: String,
    enum: ['sponsor', 'co-sponsor', 'community partner', 'technology partner', 'social media partner', 'title sponsor', 'supported by'],
    required: true,
    default: 'sponsor',
  },
  website: {
    type: String,
    trim: true,
  },
  socialMedia: {
    facebook: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    youtube: {
      type: String,
      trim: true,
    },
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
  assignedToEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  }],
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

// Indexes
sponsorSchema.index({ createdBy: 1, createdByRole: 1 });
sponsorSchema.index({ isActive: 1 });
sponsorSchema.index({ type: 1 });

sponsorSchema.pre('save', async function() {
  if (this.isModified() || this.isNew) {
    this.updatedAt = Date.now();
  }
});

module.exports = mongoose.model('Sponsor', sponsorSchema);

