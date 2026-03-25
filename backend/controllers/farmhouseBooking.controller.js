const mongoose = require('mongoose');
const Farmhouse = require('../models/Farmhouse');
const FarmhouseBooking = require('../models/FarmhouseBooking');
const { sendSuccess, sendError } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');
const { calculateFarmhousePrice } = require('../utils/farmhousePricing');

const checkAvailability = async (req, res) => {
  try {
    const { farmhouseId, checkInDate, checkOutDate } = req.query;

    const query = {
      farmhouseId,
      status: { $in: ['pending', 'confirmed'] }
    };

    if (checkInDate && checkOutDate) {
      query.$or = [
        {
          checkInDate: { $lt: new Date(checkOutDate) },
          checkOutDate: { $gt: new Date(checkInDate) }
        }
      ];
    }

    const bookings = await FarmhouseBooking.find(query);

    return sendSuccess(res, 'Availability status', {
      isAvailable: checkInDate && checkOutDate ? bookings.length === 0 : true,
      bookedDates: bookings.map(b => ({
        startDate: b.checkInDate,
        endDate: b.checkOutDate
      }))
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return sendError(res, 'Failed to check availability', 500);
  }
};

const calculateTotalPrice = async (req, res) => {
  try {
    const { farmhouseId, checkInDate, checkOutDate } = req.body;
    
    const farmhouse = await Farmhouse.findById(farmhouseId);
    if (!farmhouse) return sendError(res, 'Farmhouse not found', 404);

    const { subtotal, depositAmount, rateType, days, primaryTier } = calculateFarmhousePrice(farmhouse, checkInDate, checkOutDate);

    return sendSuccess(res, 'Price calculation', {
      totalAmount: subtotal,
      depositAmount,
      currency: 'INR',
      breakdown: {
        days,
        rateType,
        tier: primaryTier
      }
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return sendError(res, 'Failed to calculate price', 500);
  }
};

const createBooking = async (req, res) => {
  try {
    const { farmhouseId, checkInDate, checkOutDate } = req.body;

    // Check availability again before creating
    const overlappingBookings = await FarmhouseBooking.find({
      farmhouseId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          checkInDate: { $lt: new Date(checkOutDate) },
          checkOutDate: { $gt: new Date(checkInDate) }
        }
      ]
    });

    if (overlappingBookings.length > 0) {
      return sendError(res, 'Farmhouse is already booked for these dates', 400);
    }

    const farmhouse = await Farmhouse.findById(farmhouseId);
    if (!farmhouse) return sendError(res, 'Farmhouse not found', 404);

    const { subtotal, depositAmount, rateType, primaryTier } = calculateFarmhousePrice(farmhouse, checkInDate, checkOutDate);

    const booking = await FarmhouseBooking.create({
      bookingId: `FH-${uuidv4().substring(0, 8).toUpperCase()}`,
      userId: req.user._id,
      farmhouseId,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      checkInTime: farmhouse.checkInTime,
      checkOutTime: farmhouse.checkOutTime,
      selectedPricing: {
        tier: primaryTier,
        rateType: rateType,
        rate: farmhouse.pricing[primaryTier][rateType]
      },
      totalAmount: subtotal,
      depositAmount,
      status: 'pending'
    });

    return sendSuccess(res, 'Booking initiated successfully', { booking });
  } catch (error) {
    console.error('Error creating farmhouse booking:', error);
    return sendError(res, 'Failed to create booking', 500);
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await FarmhouseBooking.find({ userId: req.user._id })
      .populate('farmhouseId')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 'My bookings fetched successfully', { bookings });
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    return sendError(res, 'Failed to fetch my bookings', 500);
  }
};

const getOrganizerBookings = async (req, res) => {
  try {
    const { farmhouseId } = req.query;
    
    let query = {};
    if (farmhouseId) {
      query.farmhouseId = farmhouseId;
    } else {
      // Find all farmhouses belonging to this organizer
      const myFarmhouses = await Farmhouse.find({ 'organizer.organizerId': req.user._id }).select('_id');
      query.farmhouseId = { $in: myFarmhouses.map(f => f._id) };
    }

    const bookings = await FarmhouseBooking.find(query)
      .populate('farmhouseId')
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Organizer bookings fetched successfully', { bookings });
  } catch (error) {
    console.error('Error fetching organizer bookings:', error);
    return sendError(res, 'Failed to fetch organizer bookings', 500);
  }
};

const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      query._id = bookingId;
    } else {
      query.bookingId = bookingId;
    }

    const booking = await FarmhouseBooking.findOne(query)
      .populate('farmhouseId')
      .populate('userId', 'name email mobile');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    // Check permissions
    if (
      booking.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      booking.farmhouseId?.organizer?.organizerId?.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, 'Booking details fetched successfully', { booking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return sendError(res, 'Failed to fetch booking details', 500);
  }
};

module.exports = {
  checkAvailability,
  calculateTotalPrice,
  createBooking,
  getMyBookings,
  getOrganizerBookings,
  getBookingById
};
