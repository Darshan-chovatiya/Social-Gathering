const User = require('../../models/User');
const { sendSuccess, sendError } = require('../../utils/response');
const mailer = require('../../utils/mailer');

/**
 * Add a new organizer (Mobile API)
 * Similar to admin's createUser but optimized for mobile
 */
const addOrganizer = async (req, res) => {
  try {
    const { name, email, mobile, password, isActive = true } = req.body;

    // For register-and-email feature, email is mandatory
    if (!email) {
      return sendError(res, 'Email is required for organizer registration', 400);
    }
    
    if (!password) {
      return sendError(res, 'Password is required for organizer registration', 400);
    }

    // Check if user with email or mobile already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email }, 
        { mobile }
      ]
    });

    if (existingUser) {
      return sendError(res, 'User with this email or mobile already exists', 400);
    }

    // Handle profile picture upload if any
    const profilePicture = req.file ? `/uploads/users/${req.file.filename}` : undefined;

    // Create new organizer
    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: 'organizer',
      isActive,
      isMobileVerified: true, // Assuming mobile added by admin/app-system is verified or verified later
      profilePicture,
    });

    // Send Registration Email in background
    mailer.sendOrganizerRegistrationEmail(user, password).catch(err => {
      console.error('Failed to send registration email in background:', err);
    });

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;

    return sendSuccess(res, 'Organizer created successfully and registration email sent', { user: userResponse }, 201);
  } catch (error) {
    console.error('Error creating organizer via mobile API:', error);
    if (error.code === 11000) {
      return sendError(res, 'User with this email or mobile already exists', 400);
    }
    return sendError(res, 'Failed to create organizer', 500);
  }
};

module.exports = {
  addOrganizer,
};
