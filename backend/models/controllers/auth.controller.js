const User = require('../models/User');
const bcrypt = require('bcryptjs');
const OtpService = require('../utils/sendOTP');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/response');
const { OAuth2Client } = require('google-auth-library');

// Initialize OTP service
const otpService = new OtpService();

const sendOTP = async (req, res) => {
  try {
    const { mobile, name } = req.body;
    
    if (!mobile) {
      return sendError(res, 'Mobile number is required', 400);
    }

    // Use the new OTP service
    const result = await otpService.sendOTP(mobile, name || null);

    if (result.success) {
      return sendSuccess(res, result.message || 'OTP sent successfully', {
        sessionId: result.data?.sessionId,
        expiresAt: result.data?.expiresAt,
      });
    } else {
      return sendError(res, result.message || 'Failed to send OTP', 500);
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return sendError(res, error.message || 'Failed to send OTP', 500);
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp, name, email } = req.body;

    if (!mobile || !otp) {
      return sendError(res, 'Mobile number and OTP are required', 400);
    }

    // Verify OTP using the new OTP service
    const verifyResult = await otpService.verifyOTP(mobile, otp);

    if (!verifyResult.success) {
      return sendError(res, verifyResult.message || 'Invalid or expired OTP', 400);
    }

    // Find or create user
    let user = await User.findOne({ mobile });

    if (!user) {
      // Create new user
      user = await User.create({
        mobile,
        name: name || '',
        email: email || '',
        isMobileVerified: true,
      });
    } else {
      // Update existing user
    user.isMobileVerified = true;
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    return sendSuccess(res, 'Mobile verified successfully', {
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        isMobileVerified: user.isMobileVerified,
      },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return sendError(res, error.message || 'Failed to verify OTP', 500);
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return sendError(res, 'Access denied. Admin access only.', 403);
    }

    // Check if user is active
    if (!user.isActive) {
      return sendError(res, 'Account is inactive. Please contact administrator.', 403);
    }

    // Check if password exists
    if (!user.password) {
      return sendError(res, 'Password not set. Please contact administrator.', 400);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user._id);

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isMobileVerified: user.isMobileVerified,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    return sendError(res, 'Login failed', 500);
  }
};

const organizerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check if user is organizer
    if (user.role !== 'organizer') {
      return sendError(res, 'Access denied. Organizer access only.', 403);
    }

    // Check if user is active
    if (!user.isActive) {
      return sendError(res, 'Account is inactive. Please contact administrator.', 403);
    }

    // Check if password exists
    if (!user.password) {
      return sendError(res, 'Password not set. Please contact administrator.', 400);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user._id);

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isMobileVerified: user.isMobileVerified,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error in organizer login:', error);
    return sendError(res, 'Login failed', 500);
  }
};

const googleSignIn = async (req, res) => {
  try {
    const { idToken, mobile } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });

    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (user) {
      // Update Google info if not present
      if (!user.googleId) user.googleId = googleId;
      if (!user.name) user.name = name;
      if (!user.email) user.email = email;
      if (!user.profilePicture) user.profilePicture = picture;
    } else {
      // Create new user
      user = await User.create({
        googleId,
        name,
        email,
        profilePicture: picture,
        mobile: mobile || '',
      });
    }

    // If mobile is provided and not verified, require OTP verification
    if (mobile && !user.isMobileVerified) {
      user.mobile = mobile;
      await user.save();

      // Use the new OTP service
      const otpResult = await otpService.sendOTP(mobile, user.name || null);
      
      if (!otpResult.success) {
        return sendError(res, otpResult.message || 'Failed to send OTP', 500);
      }

      return sendSuccess(res, 'Mobile verification required', {
        requiresMobileVerification: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
      });
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 'Google sign-in successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        isMobileVerified: user.isMobileVerified,
      },
    });
  } catch (error) {
    console.error('Error with Google sign-in:', error);
    return sendError(res, 'Google sign-in failed', 500);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    return sendSuccess(res, 'User fetched successfully', {
      user: {
        id: req.user._id,
        name: req.user.name,
        mobile: req.user.mobile,
        email: req.user.email,
        role: req.user.role,
        isMobileVerified: req.user.isMobileVerified,
        profilePicture: req.user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return sendError(res, 'Failed to fetch user', 500);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  adminLogin,
  organizerLogin,
  googleSignIn,
  getCurrentUser,
};
