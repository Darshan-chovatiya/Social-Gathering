const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');
const config = require('../config/env');
const logger = require('../config/logger');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return sendError(res, 'No token provided. Authentication required.', 401);
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-otp');

    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.debug('Invalid token attempt');
      return sendError(res, 'Invalid token.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      logger.debug('Expired token attempt');
      return sendError(res, 'Token expired.', 401);
    }
    logger.error('Authentication error:', error);
    return sendError(res, 'Authentication error.', 500);
  }
};

// Check if user has required role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Access denied. Insufficient permissions.', 403);
    }

    next();
  };
};

// Check if mobile is verified
exports.requireMobileVerification = (req, res, next) => {
  if (!req.user.isMobileVerified) {
    return sendError(res, 'Mobile number verification required.', 403);
  }
  next();
};

