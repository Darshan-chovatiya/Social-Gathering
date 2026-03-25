const User = require('../models/User');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Category = require('../models/Category');
const Offer = require('../models/Offer');
const bcrypt = require('bcryptjs');
const { sendSuccess, sendError } = require('../utils/response');

const getProfile = async (req, res) => {
  try {
    return sendSuccess(res, 'Profile fetched successfully', {
      user: {
        id: req.user._id,
        name: req.user.name,
        mobile: req.user.mobile,
        email: req.user.email,
        role: req.user.role,
        isMobileVerified: req.user.isMobileVerified,
        profilePicture: req.user.profilePicture,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return sendError(res, 'Failed to fetch profile', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;

    // Handle profile picture upload
    if (req.file) {
      user.profilePicture = `/uploads/users/${req.file.filename}`;
    }

    await user.save();

    return sendSuccess(res, 'Profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        isMobileVerified: user.isMobileVerified,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return sendError(res, 'Failed to update profile', 500);
  }
};

const getBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('eventId', 'title banners address eventDetailImage eventDetailsImages eventImages')
      .populate('offerId', 'title type value')
      .populate('affiliateLinkId', 'affiliateCode referrerUserId eventId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    return sendSuccess(res, 'Bookings fetched successfully', {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return sendError(res, 'Failed to fetch bookings', 500);
  }
};

const getUpcomingEvents = async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id,
      status: 'confirmed',
      paymentStatus: 'success',
    })
      .populate('eventId', 'title banners address slots')
      .sort({ slotDate: 1 });

    const upcoming = bookings.filter(booking => {
      const slotDate = new Date(booking.slotDate);
      return slotDate > new Date();
    });

    return sendSuccess(res, 'Upcoming events fetched successfully', {
      events: upcoming,
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return sendError(res, 'Failed to fetch upcoming events', 500);
  }
};

// Get active banners (events with banners that haven't expired)
const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    
    // Find all approved, active events with banners
    // Check for non-empty banners array properly
    const events = await Event.find({
      isActive: true,
      status: 'approved',
      banners: { $exists: true, $ne: [] },
    })
      .populate('categories', 'name')
      .populate('organizer.organizerId', 'name')
      .select('title banners slots address categories organizer')
      .lean();

    // Filter events that have banners and haven't expired
    const activeBanners = events
      .filter(event => {
        // Check if event has banners
        if (!event.banners || event.banners.length === 0) return false;
        
        // Check if event has slots
        if (!event.slots || event.slots.length === 0) return false;
        
        // Check if at least one slot date is in the future
        const hasFutureSlot = event.slots.some(slot => {
          if (!slot.date || !slot.endTime) return false;
          
          try {
            const slotDate = new Date(slot.date);
            const [hours, minutes] = slot.endTime.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return false;
            
            slotDate.setHours(hours, minutes, 0, 0);
            return slotDate >= now;
          } catch (err) {
            console.error('Error parsing slot date:', err);
            return false;
          }
        });
        
        return hasFutureSlot;
      })
      .map(event => ({
        _id: event._id,
        title: event.title,
        banners: event.banners,
        address: event.address,
        categories: event.categories,
        organizer: event.organizer,
      }));

    return sendSuccess(res, 'Active banners fetched successfully', {
      banners: activeBanners,
      count: activeBanners.length,
    });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return sendError(res, 'Failed to fetch active banners', 500);
  }
};

// Get events with filters (for customer panel)
const getEvents = async (req, res) => {
  try {
    const {
      category,
      location,
      search,
      date,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { isActive: true, status: 'approved' };

    // Category filter
    if (category) {
      const categoryDoc = await Category.findOne({ name: new RegExp(category, 'i') });
      if (categoryDoc) {
        query.categories = categoryDoc._id;
      }
    }

    // Location filter
    if (location) {
      query['address.city'] = new RegExp(location, 'i');
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    // Date filter - only show events with future slots
    if (date) {
      query['slots.date'] = { $gte: new Date(date) };
    } else {
      // Default: only show events with at least one future slot
      const now = new Date();
      query['slots.date'] = { $gte: now };
    }

    const events = await Event.find(query)
      .populate('categories', 'name')
      .populate('organizer.organizerId', 'name email mobile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Price filter
    let filteredEvents = events;
    if (minPrice || maxPrice) {
      filteredEvents = events.filter(event => {
        const minTicketPrice = Math.min(...event.ticketTypes.map(t => t.price));
        const maxTicketPrice = Math.max(...event.ticketTypes.map(t => t.price));
        if (minPrice && maxTicketPrice < minPrice) return false;
        if (maxPrice && minTicketPrice > maxPrice) return false;
        return true;
      });
    }

    const total = await Event.countDocuments(query);

    return sendSuccess(res, 'Events fetched successfully', {
      events: filteredEvents,
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

// Get event by ID (for customer panel)
const getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      isActive: true,
      status: 'approved',
    })
      .populate('categories', 'name')
      .populate('sponsors', 'name logo type website socialMedia')
      .populate('organizer.organizerId', 'name email mobile profilePicture');

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    return sendSuccess(res, 'Event fetched successfully', { event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return sendError(res, 'Failed to fetch event', 500);
  }
};

// Get featured events
const getFeaturedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      isActive: true,
      status: 'approved',
      isFeatured: true,
    })
      .populate('categories', 'name')
      .populate('organizer.organizerId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    return sendSuccess(res, 'Featured events fetched successfully', {
      events,
    });
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return sendError(res, 'Failed to fetch featured events', 500);
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });

    return sendSuccess(res, 'Categories fetched successfully', {
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return sendError(res, 'Failed to fetch categories', 500);
  }
};

// Get offers for an event
const getEventOffers = async (req, res) => {
  try {
    const { eventId } = req.params;
    const now = new Date();

    const offers = await Offer.find({
      $or: [
        { eventId: eventId },
        { eventId: null }, // Global offers
      ],
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Offers fetched successfully', {
      offers,
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return sendError(res, 'Failed to fetch offers', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user and explicitly select password field
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if user has a password (not Google OAuth user)
    if (!user.password) {
      return sendError(res, 'Password change not available for Google sign-in users', 400);
    }

    // Verify current password matches the password in database
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    console.error('Error changing password:', error);
    return sendError(res, 'Failed to change password', 500);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getBookings,
  getUpcomingEvents,
  getActiveBanners,
  getEvents,
  getEventById,
  getFeaturedEvents,
  getCategories,
  getEventOffers,
};

