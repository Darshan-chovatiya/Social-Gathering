const Event = require('../models/Event');
const Category = require('../models/Category');
const Sponsor = require('../models/Sponsor');
const { sendSuccess, sendError } = require('../utils/response');

const getAllEvents = async (req, res) => {
  try {
    const {
      category,
      location,
      search,
      date,
      minPrice,
      maxPrice,
      status = 'approved',
      page = 1,
      limit = 10,
    } = req.query;

    const query = { isActive: true, status };

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

    // Date filter
    if (date) {
      query['slots.date'] = { $gte: new Date(date) };
    }

    const events = await Event.find(query)
      .populate('categories', 'name')
      .populate('sponsors', 'name logo type website socialMedia')
      .populate('organizer.organizerId', 'name email mobile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Price filter (client-side or additional query)
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

const getFeaturedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      isActive: true,
      status: 'approved',
      isFeatured: true,
    })
      .populate('categories', 'name')
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

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('categories', 'name')
      .populate('sponsors', 'name logo type website socialMedia')
      .populate('organizer.organizerId', 'name email mobile');

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    // If user is organizer, verify they own this event
    if (req.user && req.user.role === 'organizer') {
      // Handle both populated and non-populated organizerId
      // When populated, organizerId is a User object, so we need to access ._id
      // When not populated, organizerId is an ObjectId
      let organizerId;
      if (event.organizer.organizerId && typeof event.organizer.organizerId === 'object' && event.organizer.organizerId._id) {
        // Populated - it's a User object
        organizerId = event.organizer.organizerId._id.toString();
      } else {
        // Not populated - it's an ObjectId
        organizerId = event.organizer.organizerId.toString();
      }
      
      const userId = req.user._id.toString();
      
      if (organizerId !== userId) {
        return sendError(res, 'Access denied. You can only view your own events.', 403);
      }
    }

    return sendSuccess(res, 'Event fetched successfully', { event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return sendError(res, 'Failed to fetch event', 500);
  }
};

const createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    
    // Parse JSON fields
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
    if (typeof eventData.organizer === 'string') {
      eventData.organizer = JSON.parse(eventData.organizer);
    }

    // Handle file uploads - banners, eventImages, and eventDetailImage
    const banners = req.files?.banners ? req.files.banners.map(file => `/uploads/events/${file.filename}`) : [];
    const eventImages = req.files?.eventImages ? req.files.eventImages.map(file => `/uploads/events/${file.filename}`) : [];
    const eventDetailImage = req.files?.eventDetailImage && req.files.eventDetailImage.length > 0 
      ? `/uploads/events/${req.files.eventDetailImage[0].filename}` 
      : null;

    // Validate categories
    const categories = await Category.find({ _id: { $in: eventData.categories }, isActive: true });
    if (categories.length !== eventData.categories.length) {
      return sendError(res, 'One or more categories are invalid', 400);
    }

    const event = await Event.create({
      ...eventData,
      banners: banners.length > 0 ? banners : eventData.banners || [],
      eventImages: eventImages.length > 0 ? eventImages : eventData.eventImages || [],
      eventDetailImage: eventDetailImage || eventData.eventDetailImage || null,
      organizer: {
        ...eventData.organizer,
        organizerId: req.user._id,
      },
      status: 'pending',
    });

    // Update sponsor assignedToEvents
    if (eventData.sponsors && eventData.sponsors.length > 0) {
      await Sponsor.updateMany(
        { _id: { $in: eventData.sponsors } },
        { $addToSet: { assignedToEvents: event._id } }
      );
    }

    return sendSuccess(res, 'Event created successfully. Waiting for admin approval.', { event }, 201);
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

    if (event.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'You can only update your own events', 403);
    }

    const eventData = req.body;

        // Parse JSON fields if needed
        if (eventData.categories && typeof eventData.categories === 'string') {
          eventData.categories = JSON.parse(eventData.categories);
        }
        if (eventData.sponsors && typeof eventData.sponsors === 'string') {
          eventData.sponsors = JSON.parse(eventData.sponsors);
        }
        if (eventData.address && typeof eventData.address === 'string') {
          eventData.address = JSON.parse(eventData.address);
        }
        if (eventData.organizer && typeof eventData.organizer === 'string') {
          eventData.organizer = JSON.parse(eventData.organizer);
        }
        if (eventData.slots && typeof eventData.slots === 'string') {
          eventData.slots = JSON.parse(eventData.slots);
        }
    // Convert slot dates to Date objects and ensure isActive is preserved
    if (eventData.slots && Array.isArray(eventData.slots)) {
      eventData.slots = eventData.slots.map(slot => ({
        ...slot,
        date: new Date(slot.date),
        isActive: slot.isActive !== undefined ? slot.isActive : true, // Preserve isActive, default to true
      }));
    }
    
    if (eventData.ticketTypes && typeof eventData.ticketTypes === 'string') {
      eventData.ticketTypes = JSON.parse(eventData.ticketTypes);
    }
    // Ensure ticketTypes have proper types
    if (eventData.ticketTypes && Array.isArray(eventData.ticketTypes)) {
      eventData.ticketTypes = eventData.ticketTypes.map(tt => ({
        ...tt,
        price: typeof tt.price === 'string' ? parseFloat(tt.price) : tt.price,
        totalQuantity: typeof tt.totalQuantity === 'string' ? parseInt(tt.totalQuantity) : tt.totalQuantity,
        availableQuantity: typeof tt.availableQuantity === 'string' ? parseInt(tt.availableQuantity) : (tt.availableQuantity !== undefined ? tt.availableQuantity : tt.totalQuantity),
      }));
    }

    // Preserve organizerId when updating organizer info
    if (eventData.organizer) {
      eventData.organizer = {
        ...eventData.organizer,
        organizerId: event.organizer.organizerId, // Preserve existing organizerId
      };
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
      // Use the existing banners sent from frontend (user may have removed some)
      eventData.banners = eventData.existingBanners;
      // Add new banners if any
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
      // Use the existing eventImages sent from frontend (user may have removed some)
      eventData.eventImages = eventData.existingEventImages;
      // Add new eventImages if any
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

    // If status is being changed back to pending, reset approval
    if (eventData.status === 'pending' && event.status === 'approved') {
      eventData.status = 'pending';
      eventData.approvedAt = undefined;
      eventData.approvedBy = undefined;
    }

    // Update event fields
    Object.keys(eventData).forEach(key => {
      if (eventData[key] !== undefined) {
        event[key] = eventData[key];
      }
    });

    // Mark nested arrays as modified for Mongoose
    if (eventData.slots) {
      event.markModified('slots');
    }
    if (eventData.ticketTypes) {
      event.markModified('ticketTypes');
    }
    if (eventData.categories) {
      event.markModified('categories');
    }
    if (eventData.sponsors) {
      event.markModified('sponsors');
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

    return sendSuccess(res, 'Event updated successfully', { event });
  } catch (error) {
    console.error('Error updating event:', error);
    const errorMessage = error.message || 'Failed to update event';
    return sendError(res, errorMessage, 500);
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (event.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'You can only delete your own events', 403);
    }

    event.isActive = false;
    await event.save();

    return sendSuccess(res, 'Event deleted successfully');
  } catch (error) {
    console.error('Error deleting event:', error);
    return sendError(res, 'Failed to delete event', 500);
  }
};

// Get active banners (events with banners that haven't expired)
const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    
    // Find all approved, active events with banners
    const events = await Event.find({
      isActive: true,
      status: 'approved',
      banners: { $exists: true, $ne: [], $size: { $gt: 0 } }, // Events with at least one banner
    })
      .populate('categories', 'name')
      .populate('organizer.organizerId', 'name')
      .select('title banners slots address categories organizer')
      .lean();

    // Filter events that haven't expired (at least one slot date is in the future)
    const activeBanners = events
      .filter(event => {
        if (!event.slots || event.slots.length === 0) return false;
        
        // Check if at least one slot date is in the future
        const hasFutureSlot = event.slots.some(slot => {
          const slotDate = new Date(slot.date);
          // Combine date with endTime to check if event has ended
          const [hours, minutes] = slot.endTime.split(':').map(Number);
          slotDate.setHours(hours, minutes, 0, 0);
          return slotDate >= now;
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
        slots: event.slots,
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

module.exports = {
  getAllEvents,
  getFeaturedEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getActiveBanners,
};

