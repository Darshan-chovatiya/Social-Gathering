const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    unique: true,
    // Never persist "" — unique index would treat many "" as duplicates (E11000)
    set(v) {
      if (v == null) return undefined;
      const t = String(v).trim();
      return t === '' ? undefined : t;
    },
  },
  password: {
    type: String,
    select: false, // Don't include password in queries by default
  },
  isMobileVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    code: String,
    expiresAt: Date,
  },
  role: {
    type: String,
    enum: ['user', 'organizer', 'admin'],
    default: 'user',
  },
  googleId: {
    type: String,
    sparse: true,
  },
  profilePicture: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  fcmToken: {
    type: String,
    required: false,
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

// Email already has unique index from unique: true

// Hash password before saving
userSchema.pre('save', async function() {
  if (this.isModified() || this.isNew) {
    this.updatedAt = Date.now();
  }
  
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }
  
  try {
    // Hash password with cost of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

module.exports = mongoose.model('User', userSchema);

