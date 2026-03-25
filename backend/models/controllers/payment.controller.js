const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Offer = require('../models/Offer');
const Event = require('../models/Event');
const AffiliateLink = require('../models/AffiliateLink');
const { sendSuccess, sendError } = require('../utils/response');
const config = require('../config/env');

// Initialize Razorpay (only if keys are configured)
let razorpay = null;
if (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
  });
}

const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Check if Razorpay is fully configured (both keys needed for server-side order creation)
    // But we can still open Razorpay checkout with just KEY_ID
    let isDummyMode = !config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET;
    let canUseRazorpayCheckout = !!config.RAZORPAY_KEY_ID; // Can open checkout if we have key ID

    const booking = await Booking.findById(bookingId)
      .populate('eventId', 'title');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }

    if (booking.paymentStatus === 'success') {
      return sendError(res, 'Payment already completed', 400);
    }

    // Validate amount
    if (!booking.totalAmount || booking.totalAmount <= 0) {
      return sendError(res, 'Invalid booking amount', 400);
    }

    // Create Razorpay order
    let razorpayOrder;
    if (isDummyMode) {
      // If we have KEY_ID but no SECRET, create a dummy order but allow Razorpay checkout to open
      if (canUseRazorpayCheckout) {
        // Create dummy order that will work with Razorpay checkout
        razorpayOrder = {
          id: `order_dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: Math.round(booking.totalAmount * 100), // Amount in paise
          currency: 'INR',
          receipt: booking.bookingId,
          status: 'created',
          created_at: Math.floor(Date.now() / 1000),
        };
      } else {
        razorpayOrder = {
          id: `order_dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: Math.round(booking.totalAmount * 100), // Amount in paise
          currency: 'INR',
          receipt: booking.bookingId,
          status: 'created',
          created_at: Math.floor(Date.now() / 1000),
        };
      }
    } else {
      // Create Razorpay order
      const options = {
        amount: Math.round(booking.totalAmount * 100), // Convert to paise and ensure integer
        currency: 'INR',
        receipt: booking.bookingId,
        notes: {
          bookingId: booking._id.toString(),
          eventId: booking.eventId._id.toString(),
          userId: req.user._id.toString(),
        },
      };

      try {
        if (!razorpay) {
          throw new Error('Razorpay not initialized');
        }
        razorpayOrder = await razorpay.orders.create(options);
      } catch (razorpayError) {
        console.error('Razorpay API Error:', razorpayError);
        // If authentication fails, fall back to dummy mode
        if (razorpayError.statusCode === 401) {
          // Fall back to dummy mode
          razorpayOrder = {
            id: `order_dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: Math.round(booking.totalAmount * 100),
            currency: 'INR',
            receipt: booking.bookingId,
            status: 'created',
            created_at: Math.floor(Date.now() / 1000),
          };
          // Update isDummyMode flag
          isDummyMode = true;
        } else {
          // Other errors - return error
          if (razorpayError.error && razorpayError.error.description) {
            return sendError(res, `Payment gateway error: ${razorpayError.error.description}`, 500);
          }
          return sendError(res, 'Failed to create payment order. Please try again.', 500);
        }
      }
    }

    // Create payment record
    const payment = await Payment.create({
      razorpayOrderId: razorpayOrder.id,
      bookingId: booking._id,
      userId: req.user._id,
      amount: booking.totalAmount,
      status: 'pending',
    });

    // Update booking with payment ID
    booking.paymentId = payment._id;
    await booking.save();

    return sendSuccess(res, 'Payment order created successfully', {
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: config.RAZORPAY_KEY_ID || 'dummy_key', // Use dummy key if not configured
      },
      paymentId: payment._id,
      isDummyMode: isDummyMode, // Flag to indicate dummy mode
      canUseRazorpayCheckout: canUseRazorpayCheckout, // Flag to indicate if Razorpay checkout can be opened
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    return sendError(res, 'Failed to create payment order', 500);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id) {
      return sendError(res, 'Payment order ID is required', 400);
    }

    // Check if dummy mode
    const isDummyMode = !config.RAZORPAY_KEY_SECRET || razorpay_order_id.startsWith('order_dummy_');

    let razorpayPayment;
    if (isDummyMode) {
      razorpayPayment = {
        id: razorpay_payment_id || `pay_dummy_${Date.now()}`,
        method: 'card', // Use 'card' for dummy payments to match enum
        status: 'authorized',
      };
    } else {
      // Real Razorpay verification
      if (!razorpay_payment_id || !razorpay_signature) {
        return sendError(res, 'Payment verification data is required', 400);
      }

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return sendError(res, 'Invalid payment signature', 400);
      }

      // Get payment details from Razorpay
      razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    }

    // Update payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return sendError(res, 'Payment record not found', 404);
    }

    payment.razorpayPaymentId = razorpay_payment_id || razorpayPayment.id;
    payment.razorpaySignature = razorpay_signature || 'dummy_signature';
    payment.status = 'success';
    // Use 'card' for dummy payments, or the actual method from Razorpay
    payment.paymentMethod = isDummyMode ? 'card' : (razorpayPayment.method || 'card');
    payment.metadata = razorpayPayment;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.bookingId);
    booking.paymentStatus = 'success';
    booking.status = 'confirmed';
    await booking.save();

    // Update offer usage count
    if (booking.offerId) {
      const offer = await Offer.findById(booking.offerId);
      if (offer) {
        offer.usedCount += 1;
        await offer.save();
      }
    }

    return sendSuccess(res, 'Payment verified successfully', {
      payment,
      booking,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return sendError(res, 'Failed to verify payment', 500);
  }
};

// Get Razorpay key ID for frontend (public key only)
const getRazorpayKey = async (req, res) => {
  try {
    return sendSuccess(res, 'Razorpay key fetched successfully', {
      key: config.RAZORPAY_KEY_ID || null,
    });
  } catch (error) {
    console.error('Error fetching Razorpay key:', error);
    return sendError(res, 'Failed to fetch Razorpay key', 500);
  }
};

// Create Razorpay order only (minimal backend - just creates order, no payment processing)
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
      return sendError(res, 'Amount is required and must be greater than 0', 400);
    }

    if (!config.RAZORPAY_KEY_ID) {
      return sendError(res, 'Razorpay is not configured', 500);
    }

    // Check if we have SECRET key - if not, always use dummy order
    const hasSecret = config.RAZORPAY_KEY_SECRET && config.RAZORPAY_KEY_SECRET.trim() !== '';
    
    // If we have both keys AND razorpay is initialized, try to create real Razorpay order
    if (hasSecret && razorpay) {
      try {
        const options = {
          amount: Math.round(amount * 100), // Convert to paise
          currency: currency,
          receipt: receipt || `receipt_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);
        
        return sendSuccess(res, 'Razorpay order created successfully', {
          order: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: config.RAZORPAY_KEY_ID,
          },
        });
      } catch (razorpayError) {
        console.error('Razorpay API Error:', razorpayError);
        const dummyOrder = {
          id: `order_dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: Math.round(amount * 100),
          currency: currency,
          key: config.RAZORPAY_KEY_ID,
        };
        return sendSuccess(res, 'Dummy order created (Razorpay API unavailable)', {
          order: dummyOrder,
        });
      }
    } else {
      const dummyOrder = {
        id: `order_dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.round(amount * 100),
        currency: currency,
        key: config.RAZORPAY_KEY_ID,
      };
      return sendSuccess(res, 'Dummy order created (test mode)', {
        order: dummyOrder,
      });
    }
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    // Even on error, return a dummy order so frontend can proceed
    const dummyOrder = {
      id: `order_dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(req.body.amount * 100),
      currency: req.body.currency || 'INR',
      key: config.RAZORPAY_KEY_ID || 'dummy_key',
    };
    return sendSuccess(res, 'Dummy order created (error fallback)', {
      order: dummyOrder,
    });
  }
};

// Store payment details and create booking (called from frontend after payment confirmation)
const storePayment = async (req, res) => {
  const session = await Booking.db.startSession();
  session.startTransaction();
  
  try {
    const { bookingData, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, paymentMethod } = req.body;

    if (!bookingData) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'Booking data is required', 400);
    }

    const { eventId, slotId, tickets, offerCode, affiliateCode } = bookingData;

    // Get event
    const event = await Event.findById(eventId).session(session);
    if (!event || !event.isActive || event.status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'Event not found or not available', 404);
    }

    // Find slot
    const slot = event.slots.id(slotId);
    if (!slot || !slot.isActive) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'Slot not found or not available', 404);
    }

    // Validate tickets and calculate subtotal
    let subtotal = 0;
    const bookingTickets = [];

    for (const ticketReq of tickets) {
      const ticketType = event.ticketTypes.id(ticketReq.ticketTypeId);
      if (!ticketType || !ticketType.isActive) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, `Ticket type ${ticketReq.ticketTypeId} not found`, 400);
      }

      // Check slot mapping if applicable
      if (ticketType.slotId && ticketType.slotId.toString() !== slotId) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, `Ticket type ${ticketType.title} is not available for this slot`, 400);
      }

      // Check availability
      if (ticketType.availableQuantity < ticketReq.quantity) {
        await session.abortTransaction();
        session.endSession();
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
      }).session(session);

      if (offer) {
        // Check usage limit
        if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
          await session.abortTransaction();
          session.endSession();
          return sendError(res, 'Offer has reached its usage limit', 400);
        }

        // Check minimum purchase amount
        if (subtotal < offer.minPurchaseAmount) {
          await session.abortTransaction();
          session.endSession();
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
      try {
        const affiliateLink = await AffiliateLink.findOne({
          affiliateCode: affiliateCode.toUpperCase().trim(),
          isActive: true,
        }).session(session);

        if (!affiliateLink) {
          console.warn(`Affiliate code not found: ${affiliateCode.toUpperCase().trim()}`);
          // Don't fail the booking if affiliate code is invalid, just log and continue
        } else {
          // Ensure affiliate link eventId matches booking eventId
          const affiliateEventId = affiliateLink.eventId.toString();
          const bookingEventId = eventId.toString();
          
          if (affiliateEventId !== bookingEventId) {
            console.warn(`Affiliate code event mismatch: affiliate event ${affiliateEventId} vs booking event ${bookingEventId}`);
            // Don't fail the booking, just log and continue
          } else {
            // Prevent self-referral (user cannot use their own affiliate link)
            const referrerUserId = affiliateLink.referrerUserId.toString();
            const bookingUserId = req.user._id.toString();
            
            if (referrerUserId === bookingUserId) {
              console.warn(`Self-referral attempt blocked: user ${bookingUserId} tried to use their own affiliate link`);
              // Don't fail the booking, just log and continue
            } else {
              affiliateLinkId = affiliateLink._id;
            }
          }
        }
      } catch (error) {
        console.error('Error processing affiliate code:', error);
        // Don't fail the booking if there's an error processing affiliate code
      }
    } else {
    }

    // Check if dummy mode
    const isDummyMode = !config.RAZORPAY_KEY_SECRET || razorpay_order_id?.startsWith('order_dummy_');

    // Verify payment with Razorpay before storing (unless dummy mode)
    let razorpayPayment = null;
    if (!isDummyMode && razorpay_payment_id && razorpay_signature && razorpay_order_id) {
      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 'Invalid payment signature', 400);
      }

      // Fetch payment details from Razorpay to verify status
      try {
        razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
        
        // Check if payment actually succeeded
        if (razorpayPayment.status !== 'authorized' && razorpayPayment.status !== 'captured') {
          await session.abortTransaction();
          session.endSession();
          return sendError(res, `Payment verification failed: Payment status is ${razorpayPayment.status}`, 400);
        }
      } catch (razorpayError) {
        console.error('Razorpay API Error:', razorpayError);
        await session.abortTransaction();
        session.endSession();
        return sendError(res, `Payment verification failed: ${razorpayError.error?.description || 'Payment not found'}`, 400);
      }
    }

    // Generate booking ID
    const generatedBookingId = `PRIME${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Reserve tickets (reduce available quantity) - Only after payment confirmation
    for (const ticketReq of tickets) {
      const ticketType = event.ticketTypes.id(ticketReq.ticketTypeId);
      ticketType.availableQuantity -= ticketReq.quantity;
    }
    await event.save({ session });

    // Create booking with payment status as success (payment already confirmed)
    const booking = await Booking.create([{
      bookingId: generatedBookingId,
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
      paymentStatus: 'success',
      status: 'confirmed',
    }], { session });
    const createdBooking = booking[0];

    // Parse amount to number if it's a string
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Create payment record
    const payment = await Payment.create([{
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature || 'dummy_signature',
      bookingId: createdBooking._id,
      userId: req.user._id,
      amount: parsedAmount || totalAmount,
      paymentMethod: paymentMethod || (razorpayPayment?.method || 'card'),
      status: 'success',
      metadata: razorpayPayment,
    }], { session });
    const createdPayment = payment[0];

    // Update booking with payment ID
    createdBooking.paymentId = createdPayment._id;
    await createdBooking.save({ session });

    // Update offer usage count
    if (createdBooking.offerId) {
      const offer = await Offer.findById(createdBooking.offerId).session(session);
      if (offer) {
        offer.usedCount += 1;
        await offer.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Reload booking to get QR code if it was generated
    await createdBooking.populate('eventId', 'title banners address organizer venues slots ticketTypes');
    await createdBooking.populate('offerId', 'title type value');
    
    return sendSuccess(res, 'Payment stored successfully', {
      payment: createdPayment,
      booking: createdBooking,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error storing payment:', error);
    return sendError(res, `Failed to store payment: ${error.message}`, 500);
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId', 'bookingId eventId');

    if (!payment) {
      return sendError(res, 'Payment not found', 404);
    }

    // Check permissions
    if (
      payment.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'organizer'
    ) {
      return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, 'Payment fetched successfully', { payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return sendError(res, 'Failed to fetch payment', 500);
  }
};

const getPaymentByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return sendError(res, 'Booking ID is required', 400);
    }

    // Find booking first to verify ownership - try by _id first, then by bookingId string
    const mongoose = require('mongoose');
    let booking = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingId: bookingId });
    }
    
    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    // Check permissions
    if (
      booking.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'organizer'
    ) {
      return sendError(res, 'Access denied', 403);
    }

    // Find payment by booking ID
    const payment = await Payment.findOne({ bookingId: booking._id })
      .populate('bookingId', 'bookingId eventId totalAmount'); // Populate booking details if needed

    if (!payment) {
      return sendError(res, 'Payment not found for this booking', 404);
    }
    return sendSuccess(res, 'Payment fetched successfully', { payment });
  } catch (error) {
    console.error('Error fetching payment by booking ID:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      bookingId: req.params.bookingId
    });
    return sendError(res, `Failed to fetch payment: ${error.message}`, 500);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentById,
  getRazorpayKey,
  createRazorpayOrder,
  storePayment,
  getPaymentByBookingId,
};

