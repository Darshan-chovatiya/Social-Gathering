const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const { sendSuccess, sendError } = require('../utils/response');

const getEventWiseBookings = async (req, res) => {
  try {
    const { startDate, endDate, eventId } = req.query;
    const matchQuery = { paymentStatus: 'success' };

    // If organizer, filter by their events
    if (req.user.role === 'organizer') {
      const Event = require('../models/Event');
      const organizerEvents = await Event.find({
        'organizer.organizerId': req.user._id,
      }).select('_id');
      const eventIds = organizerEvents.map(e => e._id);
      matchQuery.eventId = { $in: eventIds };
    }

    if (eventId) {
      matchQuery.eventId = eventId;
    }

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const eventBookings = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$eventId',
          totalBookings: { $sum: 1 },
          totalTickets: { $sum: { $sum: '$tickets.quantity' } },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
      {
        $project: {
          eventId: '$_id',
          eventTitle: '$event.title',
          totalBookings: 1,
          totalTickets: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // Fetch Farmhouse bookings if organizer or admin
    let farmhouseBookings = [];
    const FarmhouseBooking = require('../models/FarmhouseBooking');
    const fhMatchQuery = { paymentStatus: 'success' };

    if (req.user.role === 'organizer') {
      const Farmhouse = require('../models/Farmhouse');
      const organizerFarmhouses = await Farmhouse.find({
        'organizer.organizerId': req.user._id,
      }).select('_id');
      const farmhouseIds = organizerFarmhouses.map(f => f._id);
      fhMatchQuery.farmhouseId = { $in: farmhouseIds };
    }

    if (startDate || endDate) {
      fhMatchQuery.createdAt = {};
      if (startDate) fhMatchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) fhMatchQuery.createdAt.$lte = new Date(endDate);
    }

    farmhouseBookings = await FarmhouseBooking.aggregate([
      { $match: fhMatchQuery },
      {
        $group: {
          _id: '$farmhouseId',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'farmhouses',
          localField: '_id',
          foreignField: '_id',
          as: 'farmhouse',
        },
      },
      { $unwind: '$farmhouse' },
      {
        $project: {
          farmhouseId: '$_id',
          farmhouseTitle: '$farmhouse.title',
          totalBookings: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return sendSuccess(res, 'Bookings report fetched successfully', {
      bookings: eventBookings,
      farmhouseBookings,
    });
  } catch (error) {
    console.error('Error fetching bookings report:', error);
    return sendError(res, 'Failed to fetch bookings report', 500);
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { status: 'success' };

    // If organizer, filter by their events and farmhouses
    if (req.user.role === 'organizer') {
      const Event = require('../models/Event');
      const Booking = require('../models/Booking');
      const Farmhouse = require('../models/Farmhouse');
      const FarmhouseBooking = require('../models/FarmhouseBooking');

      const organizerEvents = await Event.find({
        'organizer.organizerId': req.user._id,
      }).select('_id');
      const eventIds = organizerEvents.map(e => e._id);
      
      const organizerBookings = await Booking.find({
        eventId: { $in: eventIds },
      }).select('_id');
      const bookingIds = organizerBookings.map(b => b._id);

      const organizerFarmhouses = await Farmhouse.find({
        'organizer.organizerId': req.user._id,
      }).select('_id');
      const farmhouseIds = organizerFarmhouses.map(f => f._id);

      const organizerFhBookings = await FarmhouseBooking.find({
        farmhouseId: { $in: farmhouseIds },
      }).select('_id');
      const fhBookingIds = organizerFhBookings.map(b => b._id);

      matchQuery.bookingId = { $in: [...bookingIds, ...fhBookingIds] };
    }

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const revenue = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' },
        },
      },
    ]);

    const dailyRevenue = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return sendSuccess(res, 'Revenue report fetched successfully', {
      summary: revenue.length > 0 ? revenue[0] : {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0,
      },
      dailyRevenue,
    });
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    return sendError(res, 'Failed to fetch revenue report', 500);
  }
};

const getCategoryWiseSales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { paymentStatus: 'success' };

    // If organizer, filter by their events
    if (req.user.role === 'organizer') {
      const Event = require('../models/Event');
      const organizerEvents = await Event.find({
        'organizer.organizerId': req.user._id,
      }).select('_id');
      const eventIds = organizerEvents.map(e => e._id);
      matchQuery.eventId = { $in: eventIds };
    }

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const sales = await Booking.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
      { $unwind: '$event.categories' },
      {
        $group: {
          _id: '$event.categories',
          totalBookings: { $sum: 1 },
          totalTickets: { $sum: { $sum: '$tickets.quantity' } },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryId: '$_id',
          categoryName: '$category.name',
          totalBookings: 1,
          totalTickets: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return sendSuccess(res, 'Category-wise sales fetched successfully', {
      sales,
    });
  } catch (error) {
    console.error('Error fetching category-wise sales:', error);
    return sendError(res, 'Failed to fetch category-wise sales', 500);
  }
};

const getUserEngagement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const engagement = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$userId',
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          totalBookings: 1,
          totalSpent: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 100 },
    ]);

    return sendSuccess(res, 'User engagement fetched successfully', {
      engagement,
    });
  } catch (error) {
    console.error('Error fetching user engagement:', error);
    return sendError(res, 'Failed to fetch user engagement', 500);
  }
};

module.exports = {
  getEventWiseBookings,
  getRevenueReport,
  getCategoryWiseSales,
  getUserEngagement,
};

