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

module.exports = {
  getMyEvents,
  getAllBookings,
  getEventBookings,
  getEventStats,
};

