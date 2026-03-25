const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { sendSuccess, sendError } = require('../utils/response');

const getMyEvents = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { 'organizer.organizerId': req.user._id };

    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate('categories', 'name')
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

const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 100 } = req.query;

    // Get all events created by this organizer
    const organizerEvents = await Event.find({ 
      'organizer.organizerId': req.user._id 
    }).select('_id');
    
    const organizerEventIds = organizerEvents.map(event => event._id);

    // If organizer has no events, return empty bookings
    if (organizerEventIds.length === 0) {
      return sendSuccess(res, 'Bookings fetched successfully', {
        bookings: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
        },
      });
    }

    const query = { eventId: { $in: organizerEventIds } };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email mobile')
      .populate('eventId', 'title')
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

const getEventBookings = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Verify event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (event.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }

    const query = { eventId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email mobile')
      .populate('offerId', 'title type value')
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

const getEventStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (event.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }

    const totalBookings = await Booking.countDocuments({
      eventId,
      paymentStatus: 'success',
    });

    const confirmedBookings = await Booking.countDocuments({
      eventId,
      status: 'confirmed',
      paymentStatus: 'success',
    });

    const totalRevenue = await Payment.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking',
        },
      },
      {
        $unwind: '$booking',
      },
      {
        $match: {
          'booking.eventId': event._id,
          status: 'success',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    return sendSuccess(res, 'Event stats fetched successfully', {
      stats: {
        totalBookings,
        confirmedBookings,
        revenue,
        event: {
          id: event._id,
          title: event.title,
          status: event.status,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return sendError(res, 'Failed to fetch event stats', 500);
  }
};

const scanTicket = async (req, res) => {
  try {
    let { bookingId } = req.body;

    // Validate bookingId
    if (!bookingId) {
      return sendError(res, 'Booking ID is required', 400);
    }

    // Extract bookingId from URL if it's a URL format
    if (bookingId.includes('/tickets/')) {
      const match = bookingId.match(/\/tickets\/([^\/]+)/);
      if (match) {
        bookingId = match[1];
      }
    }

    // Find booking by bookingId
    const booking = await Booking.findOne({ bookingId })
      .populate('eventId', 'title organizer')
      .populate('userId', 'name email mobile');

    if (!booking) {
      return sendError(res, 'Ticket not found', 404);
    }

    // Verify event belongs to organizer
    if (booking.eventId.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Unauthorized. This ticket does not belong to your event.', 403);
    }

    // Validate payment status
    if (booking.paymentStatus !== 'success') {
      return sendError(res, 'Invalid ticket. Payment not completed.', 400);
    }

    // Validate booking status
    if (booking.status !== 'confirmed') {
      return sendError(res, 'Invalid ticket. Booking is not confirmed.', 400);
    }

    // Check if already scanned
    if (booking.isAttended) {
      return sendError(res, 'Ticket already scanned', 400);
    }

    // Update booking as attended
    booking.isAttended = true;
    booking.attendedAt = new Date();
    booking.scannedBy = req.user._id;
    await booking.save();

    return sendSuccess(res, 'Ticket scanned successfully', {
      booking: {
        bookingId: booking.bookingId,
        event: {
          title: booking.eventId.title,
        },
        customer: {
          name: booking.userId.name,
          email: booking.userId.email,
          mobile: booking.userId.mobile,
        },
        tickets: booking.tickets,
        totalTickets: booking.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
        attendedAt: booking.attendedAt,
      },
    });
  } catch (error) {
    console.error('Error scanning ticket:', error);
    return sendError(res, 'Failed to scan ticket', 500);
  }
};

const addPhysicalTickets = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ticketTypes } = req.body;

    // Validate request body
    if (!ticketTypes || !Array.isArray(ticketTypes) || ticketTypes.length === 0) {
      return sendError(res, 'Ticket types array is required', 400);
    }

    // Find event and verify ownership
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (event.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }

    // Validate and process each ticket type
    const updates = [];
    const errors = [];

    for (const ticketData of ticketTypes) {
      const { ticketTypeId, physicalTickets } = ticketData;

      // Validate ticketTypeId
      if (!ticketTypeId) {
        errors.push('Ticket type ID is required');
        continue;
      }

      // Validate physicalTickets
      const physicalCount = parseInt(physicalTickets);
      if (isNaN(physicalCount) || physicalCount <= 0) {
        errors.push(`Invalid physical tickets count for ticket type ${ticketTypeId}`);
        continue;
      }

      // Find ticket type in event
      const ticketType = event.ticketTypes.id(ticketTypeId);
      if (!ticketType) {
        errors.push(`Ticket type ${ticketTypeId} not found in event`);
        continue;
      }

      // Calculate new available quantity
      const currentAvailable = ticketType.availableQuantity || 0;
      const newAvailable = currentAvailable - physicalCount;

      // Validate that available quantity won't go below 0
      if (newAvailable < 0) {
        errors.push(
          `Cannot add ${physicalCount} physical tickets to "${ticketType.title}". ` +
          `Available quantity would become negative (${newAvailable}). ` +
          `Maximum allowed: ${currentAvailable}`
        );
        continue;
      }

      // Update ticket type
      ticketType.availableQuantity = newAvailable;
      // Total quantity remains unchanged
      updates.push({
        ticketTypeId,
        ticketTypeTitle: ticketType.title,
        physicalTickets: physicalCount,
        oldAvailable: currentAvailable,
        newAvailable,
      });
    }

    // If there are errors, return them
    if (errors.length > 0) {
      return sendError(res, errors.join('; '), 400);
    }

    // If no updates, return error
    if (updates.length === 0) {
      return sendError(res, 'No valid ticket types to update', 400);
    }

    // Mark ticketTypes as modified for Mongoose
    event.markModified('ticketTypes');

    // Save event
    await event.save();

    // Return success with update details
    return sendSuccess(res, 'Physical tickets added successfully', {
      event: {
        id: event._id,
        title: event.title,
      },
      updates,
    });
  } catch (error) {
    console.error('Error adding physical tickets:', error);
    return sendError(res, 'Failed to add physical tickets', 500);
  }
};

const getScannedTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, eventId } = req.query;

    // Get all events created by this organizer
    const organizerEvents = await Event.find({ 
      'organizer.organizerId': req.user._id 
    }).select('_id');
    
    const organizerEventIds = organizerEvents.map(event => event._id);

    // If organizer has no events, return empty list
    if (organizerEventIds.length === 0) {
      return sendSuccess(res, 'Scanned tickets fetched successfully', {
        tickets: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
        },
      });
    }

    // Build query for scanned tickets
    const query = { 
      eventId: { $in: organizerEventIds },
      isAttended: true 
    };

    // Filter by event if provided
    if (eventId) {
      // Verify event belongs to organizer
      const event = await Event.findById(eventId);
      if (event && event.organizer.organizerId.toString() === req.user._id.toString()) {
        query.eventId = eventId;
      }
    }

    const scannedTickets = await Booking.find(query)
      .populate('userId', 'name email mobile')
      .populate('eventId', 'title')
      .populate('scannedBy', 'name email')
      .sort({ attendedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    return sendSuccess(res, 'Scanned tickets fetched successfully', {
      tickets: scannedTickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching scanned tickets:', error);
    return sendError(res, 'Failed to fetch scanned tickets', 500);
  }
};

module.exports = {
  getMyEvents,
  getAllBookings,
  getEventBookings,
  getEventStats,
  addPhysicalTickets,
  scanTicket,
  getScannedTickets,
};

