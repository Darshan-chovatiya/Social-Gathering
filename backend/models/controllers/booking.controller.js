const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Offer = require('../models/Offer');
const AffiliateLink = require('../models/AffiliateLink');
const { sendSuccess, sendError } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const mongoose = require('mongoose');

const createBooking = async (req, res) => {
  try {
    const { eventId, slotId, tickets, offerCode, affiliateCode } = req.body;

    // Get event
    const event = await Event.findById(eventId);
    if (!event || !event.isActive || event.status !== 'approved') {
      return sendError(res, 'Event not found or not available', 404);
    }

    // Find slot
    const slot = event.slots.id(slotId);
    if (!slot || !slot.isActive) {
      return sendError(res, 'Slot not found or not available', 404);
    }

    // Validate tickets and calculate subtotal
    let subtotal = 0;
    const bookingTickets = [];

    for (const ticketReq of tickets) {
      const ticketType = event.ticketTypes.id(ticketReq.ticketTypeId);
      if (!ticketType || !ticketType.isActive) {
        return sendError(res, `Ticket type ${ticketReq.ticketTypeId} not found`, 400);
      }

      // Check slot mapping if applicable
      if (ticketType.slotId && ticketType.slotId.toString() !== slotId) {
        return sendError(res, `Ticket type ${ticketType.title} is not available for this slot`, 400);
      }

      // Check availability
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

    // Apply offer if provided
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
        // Check usage limit
        if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
          return sendError(res, 'Offer has reached its usage limit', 400);
        }

        // Check minimum purchase amount
        if (subtotal < offer.minPurchaseAmount) {
          return sendError(res, `Minimum purchase amount of ₹${offer.minPurchaseAmount} required for this offer`, 400);
        }

        // Calculate discount
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

    // Validate and link affiliate code if provided
    let affiliateLinkId = null;
    if (affiliateCode) {
      const affiliateLink = await AffiliateLink.findOne({
        affiliateCode: affiliateCode.toUpperCase(),
        isActive: true,
      });

      if (!affiliateLink) {
        return sendError(res, 'Invalid or inactive affiliate code', 400);
      }

      // Ensure affiliate link eventId matches booking eventId
      if (affiliateLink.eventId.toString() !== eventId) {
        return sendError(res, 'Affiliate code is not valid for this event', 400);
      }

      // Prevent self-referral (user cannot use their own affiliate link)
      if (affiliateLink.referrerUserId.toString() === req.user._id.toString()) {
        return sendError(res, 'You cannot use your own affiliate link', 400);
      }

      affiliateLinkId = affiliateLink._id;
    }

    // Generate booking ID
    const bookingId = `PRIME${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create booking
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

    // Reserve tickets (reduce available quantity)
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
    const booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title banners eventDetailImage eventDetailsImages eventImages address organizer venues slotId slots ticketTypes')
      .populate('offerId', 'title type value');

    // If not found by _id, try finding by bookingId
    if (!booking) {
      booking = await Booking.findOne({ bookingId: req.params.id })
        .populate('eventId', 'title banners address organizer venues slotId slots ticketTypes')
        .populate('offerId', 'title type value');
    }

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    // If booking is confirmed but QR code is missing, generate it
    if (booking.paymentStatus === 'success' && booking.status === 'confirmed' && !booking.qrCode) {
      const baseUrl = process.env.FRONTEND_URL || 'https://socialgathering.itfuturz.in';
      const qrDataUrl = `${baseUrl}/tickets/${booking.bookingId}/download`;
      booking.qrCode = await QRCode.toDataURL(qrDataUrl);
      await booking.save(); // Save the booking with the newly generated QR code
    }

    // Check if user owns this booking or is admin/organizer
    if (
      booking.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'organizer'
    ) {
      return sendError(res, 'Access denied', 403);
    }

    // Generate QR code if missing and booking is confirmed
    if (!booking.qrCode && booking.paymentStatus === 'success' && booking.status === 'confirmed') {
      try {
        const QRCode = require('qrcode');
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

    // Check permissions
    if (
      booking.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return sendError(res, 'Access denied', 403);
    }

    if (booking.status === 'cancelled') {
      return sendError(res, 'Booking is already cancelled', 400);
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by user';

    // Release tickets
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

    // Find booking by bookingId string
    let booking = await Booking.findOne({ bookingId: bookingId })
      .populate('eventId', 'title venues address');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    // Verify eventId and userId if provided
    if (eventId && booking.eventId._id.toString() !== eventId) {
      return sendError(res, 'Invalid event ID', 400);
    }

    if (userId && booking.userId.toString() !== userId) {
      return sendError(res, 'Invalid user ID', 400);
    }

    // Check if booking is confirmed
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
  createBooking,
  getBookingById,
  cancelBooking,
  verifyQRCode,
};

