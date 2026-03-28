/**
 * Mobile API - Bookings controller for customer panel
 */
const Booking = require('../../models/Booking');
const Event = require('../../models/Event');
const Offer = require('../../models/Offer');
const AffiliateLink = require('../../models/AffiliateLink');
const UsedCoupon = require('../../models/UsedCoupon');
const { sendSuccess, sendError } = require('../../utils/response');
const QRCode = require('qrcode');
const config = require('../../config/env');

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

const createBooking = async (req, res) => {
  try {
    const { eventId, slotId, tickets, offerCode, affiliateCode } = req.body;

    const event = await Event.findById(eventId);
    if (!event || !event.isActive || event.status !== 'approved') {
      return sendError(res, 'Event not found or not available', 404);
    }

    const slot = event.slots.id(slotId);
    if (!slot || !slot.isActive) {
      return sendError(res, 'Slot not found or not available', 404);
    }

    let subtotal = 0;
    const bookingTickets = [];

    for (const ticketReq of tickets) {
      const ticketType = event.ticketTypes.id(ticketReq.ticketTypeId);
      if (!ticketType || !ticketType.isActive) {
        return sendError(res, `Ticket type ${ticketReq.ticketTypeId} not found`, 400);
      }

      if (ticketType.slotId && ticketType.slotId.toString() !== slotId) {
        return sendError(res, `Ticket type ${ticketType.title} is not available for this slot`, 400);
      }

      if (ticketType.availableQuantity < ticketReq.quantity) {
        return sendError(res, `Insufficient tickets available for ${ticketType.title}`, 400);
      }

      const totalAmount = ticketType.price * ticketReq.quantity;
      subtotal += totalAmount;

      bookingTickets.push({
        ticketTypeId: ticketType._id,
        ticketTypeTitle: ticketType.title,
        quantity: ticketReq.quantity,
        price: ticketType.price,
        totalAmount,
      });
    }

    let discount = 0;
    let offerId = null;
    if (offerCode) {
      const offer = await Offer.findOne({
        code: offerCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
        $or: [
          { eventId: eventId },
          { categoryId: { $in: event.categories } },
          { eventId: null, categoryId: null },
        ],
      });

      if (offer) {
        if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
          return sendError(res, 'Offer has reached its usage limit', 400);
        }

        const perCustomerLimit = offer.perCustomerLimit || 1;
        const customerUsageCount = await UsedCoupon.countDocuments({
          userId: req.user._id,
          offerId: offer._id,
        });

        if (customerUsageCount >= perCustomerLimit) {
          return sendError(
            res,
            `You have already used this offer ${perCustomerLimit} time(s). Maximum usage limit reached.`,
            400
          );
        }

        if (subtotal < offer.minPurchaseAmount) {
          return sendError(res, `Minimum purchase amount of ₹${offer.minPurchaseAmount} required for this offer`, 400);
        }

        if (offer.type === 'flat') {
          discount = Math.min(offer.value, subtotal);
        } else if (offer.type === 'percentage') {
          discount = (subtotal * offer.value) / 100;
          if (offer.maxDiscount) {
            discount = Math.min(discount, offer.maxDiscount);
          }
        }

        offerId = offer._id;
      }
    }

    const totalAmount = subtotal - discount;

    let affiliateLinkId = null;
    if (affiliateCode) {
      const affiliateLink = await AffiliateLink.findOne({
        affiliateCode: affiliateCode.toUpperCase(),
        isActive: true,
      });

      if (!affiliateLink) {
        return sendError(res, 'Invalid or inactive affiliate code', 400);
      }

      if (affiliateLink.eventId.toString() !== eventId) {
        return sendError(res, 'Affiliate code is not valid for this event', 400);
      }

      if (affiliateLink.referrerUserId.toString() === req.user._id.toString()) {
        return sendError(res, 'You cannot use your own affiliate link', 400);
      }

      affiliateLinkId = affiliateLink._id;
    }

    const bookingId = `PRIME${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const booking = await Booking.create({
      bookingId,
      userId: req.user._id,
      eventId,
      slotId,
      slotDate: slot.date,
      slotStartTime: slot.startTime,
      slotEndTime: slot.endTime,
      tickets: bookingTickets,
      subtotal,
      discount,
      offerId,
      totalAmount,
      affiliateLinkId,
      paymentStatus: 'pending',
      status: 'pending',
    });

    for (const ticketReq of tickets) {
      const ticketType = event.ticketTypes.id(ticketReq.ticketTypeId);
      ticketType.availableQuantity -= ticketReq.quantity;
    }
    await event.save();

    return sendSuccess(res, 'Booking created successfully', { booking }, 201);
  } catch (error) {
    console.error('Error creating booking:', error);
    return sendError(res, 'Failed to create booking', 500);
  }
};

const getBookingById = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title banners eventDetailImage eventDetailsImages eventImages address organizer venues slotId slots ticketTypes')
      .populate('offerId', 'title type value');

    if (!booking) {
      booking = await Booking.findOne({ bookingId: req.params.id })
        .populate('eventId', 'title banners address organizer venues slotId slots ticketTypes')
        .populate('offerId', 'title type value');
    }

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.paymentStatus === 'success' && booking.status === 'confirmed' && !booking.qrCode) {
      const baseUrl = config.FRONTEND_URL || 'https://socialgathering.itfuturz.in';
      const qrDataUrl = `${baseUrl}/tickets/${booking.bookingId}/download`;
      booking.qrCode = await QRCode.toDataURL(qrDataUrl);
      await booking.save();
    }

    if (
      booking.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'organizer'
    ) {
      return sendError(res, 'Access denied', 403);
    }

    if (!booking.qrCode && booking.paymentStatus === 'success' && booking.status === 'confirmed') {
      try {
        const qrData = JSON.stringify({
          bookingId: booking.bookingId,
          eventId: booking.eventId._id.toString(),
          userId: booking.userId.toString(),
        });
        booking.qrCode = await QRCode.toDataURL(qrData);
        await booking.save();
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }

    return sendSuccess(res, 'Booking fetched successfully', { booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return sendError(res, 'Failed to fetch booking', 500);
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (
      booking.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return sendError(res, 'Access denied', 403);
    }

    if (booking.status === 'cancelled') {
      return sendError(res, 'Booking is already cancelled', 400);
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body?.reason || 'Cancelled by user';

    const event = await Event.findById(booking.eventId);
    for (const ticket of booking.tickets) {
      const ticketType = event.ticketTypes.id(ticket.ticketTypeId);
      if (ticketType) {
        ticketType.availableQuantity += ticket.quantity;
      }
    }
    await event.save();
    await booking.save();

    return sendSuccess(res, 'Booking cancelled successfully', { booking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return sendError(res, 'Failed to cancel booking', 500);
  }
};

const verifyQRCode = async (req, res) => {
  try {
    const { bookingId, eventId, userId } = req.body;

    if (!bookingId) {
      return sendError(res, 'Booking ID is required', 400);
    }

    let booking = await Booking.findOne({ bookingId: bookingId })
      .populate('eventId', 'title venues address');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (eventId && booking.eventId._id.toString() !== eventId) {
      return sendError(res, 'Invalid event ID', 400);
    }

    if (userId && booking.userId.toString() !== userId) {
      return sendError(res, 'Invalid user ID', 400);
    }

    if (booking.paymentStatus !== 'success' || booking.status !== 'confirmed') {
      return sendError(res, 'Booking is not confirmed', 400);
    }

    return sendSuccess(res, 'Ticket verified successfully', {
      booking: {
        bookingId: booking.bookingId,
        eventTitle: booking.eventId.title,
        slotDate: booking.slotDate,
        slotStartTime: booking.slotStartTime,
        slotEndTime: booking.slotEndTime,
        venue: booking.eventId.venues?.[0]?.fullAddress || booking.eventId.address,
        tickets: booking.tickets,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    console.error('Error verifying QR code:', error);
    return sendError(res, 'Failed to verify QR code', 500);
  }
};

module.exports = {
  verifyQRCode,
  getBookings,
  createBooking,
  getBookingById,
  cancelBooking,
};
