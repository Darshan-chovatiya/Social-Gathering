/**
 * Mobile API - Auth controller (customer panel)
 */
const User = require('../../models/User');
const OtpService = require('../../utils/sendOTP');
const generateToken = require('../../utils/generateToken');
const { sendSuccess, sendError } = require('../../utils/response');
const { OAuth2Client } = require('google-auth-library');
const config = require('../../config/env');

const otpService = new OtpService();

const sendOTP = async (req, res) => {
  try {
    const { mobile, name } = req.body;

    if (!mobile) {
      return sendError(res, 'Mobile number is required', 400);
    }

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
    const { mobile, otp, name, email, fcmToken } = req.body;

    if (!mobile || !otp) {
      return sendError(res, 'Mobile number and OTP are required', 400);
    }

    // OTP Bypass check
    const isBypass = (otp === config.BYPASS_OTP) && 
                    (config.BYPASS_NUMBERS.length === 0 || config.BYPASS_NUMBERS.includes(mobile));

    if (!isBypass) {
      // Verify OTP using the real service
      const verifyResult = await otpService.verifyOTP(mobile, otp);

      if (!verifyResult.success) {
        // Return a generic error to avoid leaking bypass or internal service details
        return sendError(res, 'Invalid or expired OTP', 400);
      }
    }

    let user = await User.findOne({ mobile });

    if (!user) {
      user = await User.create({
        mobile,
        name: name || '',
        email: email || '',
        isMobileVerified: true,
        fcmToken: fcmToken || '',
      });
    } else {
      user.isMobileVerified = true;
      if (name) user.name = name;
      if (email) user.email = email;
      if (fcmToken) user.fcmToken = fcmToken;
      await user.save();
    }

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

const googleSignIn = async (req, res) => {
  try {
    const { idToken, mobile, fcmToken } = req.body;
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
      if (!user.googleId) user.googleId = googleId;
      if (!user.name) user.name = name;
      if (!user.email) user.email = email;
      if (!user.profilePicture) user.profilePicture = picture;
      if (fcmToken) user.fcmToken = fcmToken;
    } else {
      user = await User.create({
        googleId,
        name,
        email,
        profilePicture: picture,
        mobile: mobile || '',
        fcmToken: fcmToken || '',
      });
    }

    if (mobile && !user.isMobileVerified) {
      user.mobile = mobile;
      await user.save();

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
  googleSignIn,
  getCurrentUser,
};
