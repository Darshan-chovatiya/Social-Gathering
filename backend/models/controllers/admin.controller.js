const User = require('../models/User');
const Event = require('../models/Event');
const Category = require('../models/Category');
const Sponsor = require('../models/Sponsor');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { sendSuccess, sendError } = require('../utils/response');

const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const users = await User.find(query)
      .select('-otp')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return sendSuccess(res, 'Users fetched successfully', {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return sendError(res, 'Failed to fetch users', 500);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.isActive = req.body.isActive;
    await user.save();

    return sendSuccess(res, 'User status updated successfully', { user });
  } catch (error) {
    console.error('Error updating user status:', error);
    return sendError(res, 'Failed to update user status', 500);
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.role = req.body.role;
    await user.save();

    return sendSuccess(res, 'User role updated successfully', { user });
  } catch (error) {
    console.error('Error updating user role:', error);
    return sendError(res, 'Failed to update user role', 500);
  }
};

const getPendingEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const events = await Event.find({ status: 'pending' })
      .populate('categories', 'name')
      .populate('sponsors', 'name logo type website socialMedia')
      .populate('organizer.organizerId', 'name email mobile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments({ status: 'pending' });

    return sendSuccess(res, 'Pending events fetched successfully', {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching pending events:', error);
    return sendError(res, 'Failed to fetch pending events', 500);
  }
};

const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    event.status = 'approved';
    event.approvedBy = req.user._id;
    event.approvedAt = new Date();
    await event.save();

    return sendSuccess(res, 'Event approved successfully', { event });
  } catch (error) {
    console.error('Error approving event:', error);
    return sendError(res, 'Failed to approve event', 500);
  }
};

const rejectEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    event.status = 'rejected';
    event.rejectionReason = req.body.reason;
    await event.save();

    return sendSuccess(res, 'Event rejected successfully', { event });
  } catch (error) {
    console.error('Error rejecting event:', error);
    return sendError(res, 'Failed to reject event', 500);
  }
};

const featureEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    event.isFeatured = req.body.isFeatured;
    await event.save();

    return sendSuccess(res, `Event ${req.body.isFeatured ? 'featured' : 'unfeatured'} successfully`, { event });
  } catch (error) {
    console.error('Error updating event feature status:', error);
    return sendError(res, 'Failed to update event feature status', 500);
  }
};

const getAllEvents = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate('categories', 'name')
      .populate('sponsors', 'name logo type website socialMedia')
      .populate('organizer.organizerId', 'name email mobile')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    return sendSuccess(res, 'Events fetched successfully', {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return sendError(res, 'Failed to fetch events', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, mobile, password, role = 'organizer', isActive = true } = req.body;

    // Check if user with email or mobile already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return sendError(res, 'User with this email or mobile already exists', 400);
    }

    // Handle profile picture upload
    const profilePicture = req.file ? `/uploads/users/${req.file.filename}` : undefined;

    // Create new user
    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role,
      isActive,
      isMobileVerified: true,
      profilePicture,
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;

    return sendSuccess(res, 'User created successfully', { user: userResponse }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      return sendError(res, 'User with this email or mobile already exists', 400);
    }
    return sendError(res, 'Failed to create user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if email or mobile is being changed and if it conflicts
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return sendError(res, 'User with this email already exists', 400);
      }
    }

    if (mobile && mobile !== user.mobile) {
      const existingUser = await User.findOne({ mobile, _id: { $ne: user._id } });
      if (existingUser) {
        return sendError(res, 'User with this mobile already exists', 400);
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (password) user.password = password;

    // Handle profile picture upload
    if (req.file) {
      user.profilePicture = `/uploads/users/${req.file.filename}`;
    }

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;

    return sendSuccess(res, 'User updated successfully', { user: userResponse });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 11000) {
      return sendError(res, 'User with this email or mobile already exists', 400);
    }
    return sendError(res, 'Failed to update user', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if user has any events
    const eventCount = await Event.countDocuments({ 'organizer.organizerId': user._id });
    if (eventCount > 0) {
      return sendError(
        res,
        `Cannot delete organizer. They have ${eventCount} event(s) associated.`,
        400
      );
    }

    await User.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    return sendError(res, 'Failed to delete user', 500);
  }
};

const createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    const { organizerId } = eventData;

    // Validate organizer if provided
    if (organizerId) {
      const organizer = await User.findById(organizerId);
      if (!organizer) {
        return sendError(res, 'Organizer not found', 404);
      }
      if (organizer.role !== 'organizer') {
        return sendError(res, 'User is not an organizer', 400);
      }
      if (!organizer.isActive) {
        return sendError(res, 'Organizer is inactive', 400);
      }

      // Set organizer info
      eventData.organizer = {
        organizerId: organizer._id,
        name: organizer.name,
        contactInfo: organizer.email || organizer.mobile,
      };
    } else {
      return sendError(res, 'Organizer ID is required', 400);
    }

    // Parse JSON fields if they are strings
    if (typeof eventData.categories === 'string') {
      eventData.categories = JSON.parse(eventData.categories);
    }
    if (typeof eventData.sponsors === 'string') {
      eventData.sponsors = JSON.parse(eventData.sponsors);
    }
    if (typeof eventData.slots === 'string') {
      eventData.slots = JSON.parse(eventData.slots);
    }
    if (typeof eventData.ticketTypes === 'string') {
      eventData.ticketTypes = JSON.parse(eventData.ticketTypes);
    }
    if (typeof eventData.address === 'string') {
      eventData.address = JSON.parse(eventData.address);
    }

    // Validate categories
    if (eventData.categories && eventData.categories.length > 0) {
      const categories = await Category.find({ _id: { $in: eventData.categories }, isActive: true });
      if (categories.length !== eventData.categories.length) {
        return sendError(res, 'One or more categories are invalid', 400);
      }
    }

    // Handle file uploads - banners, eventImages, and eventDetailImage
    const banners = req.files?.banners ? req.files.banners.map(file => `/uploads/events/${file.filename}`) : [];
    const eventImages = req.files?.eventImages ? req.files.eventImages.map(file => `/uploads/events/${file.filename}`) : [];
    const eventDetailImage = req.files?.eventDetailImage && req.files.eventDetailImage.length > 0 
      ? `/uploads/events/${req.files.eventDetailImage[0].filename}` 
      : null;

    // Admin-created events are automatically approved
    const event = await Event.create({
      ...eventData,
      banners: banners.length > 0 ? banners : eventData.banners || [],
      eventImages: eventImages.length > 0 ? eventImages : eventData.eventImages || [],
      eventDetailImage: eventDetailImage || eventData.eventDetailImage || null,
      status: 'approved',
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    // Update sponsor assignedToEvents
    if (eventData.sponsors && eventData.sponsors.length > 0) {
      await Sponsor.updateMany(
        { _id: { $in: eventData.sponsors } },
        { $addToSet: { assignedToEvents: event._id } }
      );
    }

    const populatedEvent = await Event.findById(event._id)
      .populate('categories', 'name')
      .populate('sponsors', 'name logo type website socialMedia')
      .populate('organizer.organizerId', 'name email mobile');

    return sendSuccess(res, 'Event created and approved successfully', { event: populatedEvent }, 201);
  } catch (error) {
    console.error('Error creating event:', error);
    return sendError(res, 'Failed to create event', 500);
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    const eventData = req.body;
    const { organizerId } = eventData;

    // Validate organizer if provided
    if (organizerId && organizerId !== event.organizer.organizerId.toString()) {
      const organizer = await User.findById(organizerId);
      if (!organizer) {
        return sendError(res, 'Organizer not found', 404);
      }
      if (organizer.role !== 'organizer') {
        return sendError(res, 'User is not an organizer', 400);
      }
      if (!organizer.isActive) {
        return sendError(res, 'Organizer is inactive', 400);
      }

      // Set organizer info
      eventData.organizer = {
        organizerId: organizer._id,
        name: organizer.name,
        contactInfo: organizer.email || organizer.mobile,
      };
    }

    // Parse JSON fields if they are strings
    if (eventData.categories && typeof eventData.categories === 'string') {
      eventData.categories = JSON.parse(eventData.categories);
    }
    if (eventData.sponsors && typeof eventData.sponsors === 'string') {
      eventData.sponsors = JSON.parse(eventData.sponsors);
    }
    if (eventData.slots && typeof eventData.slots === 'string') {
      eventData.slots = JSON.parse(eventData.slots);
    }
    if (eventData.ticketTypes && typeof eventData.ticketTypes === 'string') {
      eventData.ticketTypes = JSON.parse(eventData.ticketTypes);
    }
    if (eventData.address && typeof eventData.address === 'string') {
      eventData.address = JSON.parse(eventData.address);
    }

    // Validate categories
    if (eventData.categories && eventData.categories.length > 0) {
      const categories = await Category.find({ _id: { $in: eventData.categories }, isActive: true });
      if (categories.length !== eventData.categories.length) {
        return sendError(res, 'One or more categories are invalid', 400);
      }
    }

    // Handle file uploads - banners and eventImages
    // Handle banners
    if (req.files?.banners && req.files.banners.length > 0) {
      const newBanners = req.files.banners.map(file => `/uploads/events/${file.filename}`);
      eventData.banners = [...(event.banners || []), ...newBanners];
    }
    
    // Handle existing banners if sent from frontend (for deletion/reordering)
    if (eventData.existingBanners) {
      if (typeof eventData.existingBanners === 'string') {
        try {
          eventData.existingBanners = JSON.parse(eventData.existingBanners);
        } catch (e) {
          eventData.existingBanners = [eventData.existingBanners];
        }
      }
      eventData.banners = eventData.existingBanners;
      if (req.files?.banners && req.files.banners.length > 0) {
        const newBanners = req.files.banners.map(file => `/uploads/events/${file.filename}`);
        eventData.banners = [...eventData.banners, ...newBanners];
      }
    }
    
    // Handle eventImages
    if (req.files?.eventImages && req.files.eventImages.length > 0) {
      const newEventImages = req.files.eventImages.map(file => `/uploads/events/${file.filename}`);
      eventData.eventImages = [...(event.eventImages || []), ...newEventImages];
    }
    
    // Handle existing eventImages if sent from frontend (for deletion/reordering)
    if (eventData.existingEventImages) {
      if (typeof eventData.existingEventImages === 'string') {
        try {
          eventData.existingEventImages = JSON.parse(eventData.existingEventImages);
        } catch (e) {
          eventData.existingEventImages = [eventData.existingEventImages];
        }
      }
      eventData.eventImages = eventData.existingEventImages;
      if (req.files?.eventImages && req.files.eventImages.length > 0) {
        const newEventImages = req.files.eventImages.map(file => `/uploads/events/${file.filename}`);
        eventData.eventImages = [...eventData.eventImages, ...newEventImages];
      }
    }

    // Handle eventDetailImage (single file)
    if (req.files?.eventDetailImage && req.files.eventDetailImage.length > 0) {
      eventData.eventDetailImage = `/uploads/events/${req.files.eventDetailImage[0].filename}`;
    } else if (eventData.existingEventDetailImage) {
      // Keep existing if no new file uploaded
      if (typeof eventData.existingEventDetailImage === 'string') {
        eventData.eventDetailImage = eventData.existingEventDetailImage;
      }
    }

    // Update event fields
    Object.keys(eventData).forEach(key => {
      if (eventData[key] !== undefined && key !== 'organizerId') {
        event[key] = eventData[key];
      }
    });

    // Mark nested arrays as modified for Mongoose
    if (eventData.categories) {
      event.markModified('categories');
    }
    if (eventData.sponsors) {
      event.markModified('sponsors');
    }
    if (eventData.slots) {
      event.markModified('slots');
    }
    if (eventData.ticketTypes) {
      event.markModified('ticketTypes');
    }
    if (eventData.banners) {
      event.markModified('banners');
    }
    if (eventData.eventImages) {
      event.markModified('eventImages');
    }

    await event.save();

    // Update sponsor assignedToEvents
    if (eventData.sponsors !== undefined) {
      // Remove event from all sponsors first
      await Sponsor.updateMany(
        { assignedToEvents: event._id },
        { $pull: { assignedToEvents: event._id } }
      );
      
      // Add event to new sponsors
      if (eventData.sponsors.length > 0) {
        await Sponsor.updateMany(
          { _id: { $in: eventData.sponsors } },
          { $addToSet: { assignedToEvents: event._id } }
        );
      }
    }

    const populatedEvent = await Event.findById(event._id)
      .populate('categories', 'name')
      .populate('sponsors', 'name logo type website socialMedia')
      .populate('organizer.organizerId', 'name email mobile');

    return sendSuccess(res, 'Event updated successfully', { event: populatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return sendError(res, 'Failed to update event', 500);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserRole,
  getPendingEvents,
  approveEvent,
  rejectEvent,
  featureEvent,
  getAllEvents,
  createEvent,
  updateEvent,
};

