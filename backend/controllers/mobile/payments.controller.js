/**
 * Mobile API - Payments controller for customer panel
 */
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const Offer = require('../../models/Offer');
const Event = require('../../models/Event');
const AffiliateLink = require('../../models/AffiliateLink');
const UsedCoupon = require('../../models/UsedCoupon');
const { sendSuccess, sendError } = require('../../utils/response');
const config = require('../../config/env');
const { decrypt } = require('../../utils/encryption.util');
const CashfreeService = require('../../utils/cashfree.util');
const CCAvenueService = require('../../utils/ccavenue.util');

// Initialize Razorpay (only if keys are configured)
let razorpay = null;
if (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
  });
}

const createOrder = async (req, res) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (sessionError) {
    // MongoDB might not support transactions (standalone)
    session = null;
  }

  try {
    const { bookingId, bookingData, amount } = req.body;
    let booking;
    let eventDoc;

    if (bookingId) {
      // Try finding in Booking model first
      let query = Booking.findById(bookingId).populate('eventId');
      if (session) query.session(session);
      booking = await query;
      const bookingModel = 'Booking';

      if (!booking) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return sendError(res, 'Booking not found', 404);
      }

      if (booking.userId.toString() !== req.user._id.toString()) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return sendError(res, 'Access denied', 403);
      }

      if (booking.paymentStatus === 'success') {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return sendError(res, 'Payment already completed', 400);
      }
      eventDoc = booking.eventId;
      booking.bookingModel = bookingModel;
    } else if (bookingData) {
      if (bookingData.eventId) {
        const { eventId, slotId, tickets, offerCode, affiliateCode } = bookingData;

        const eventQuery = Event.findById(eventId);
        if (session) eventQuery.session(session);
        const event = await eventQuery;

        if (!event || !event.isActive || event.status !== 'approved') {
          if (session) {
            await session.abortTransaction();
            session.endSession();
          }
          return sendError(res, 'Event not found or not available', 404);
        }

        const slot = event.slots.id(slotId);
        if (!slot || !slot.isActive) {
          if (session) {
            await session.abortTransaction();
            session.endSession();
          }
          return sendError(res, 'Slot not found or not available', 404);
        }

        // Calculate total correctly
        let subtotal = 0;
        const bookingTickets = [];
        for (const ticketReq of tickets) {
          const ticketType = event.ticketTypes.id(ticketReq.ticketTypeId);
          if (!ticketType || !ticketType.isActive) {
            if (session) {
              await session.abortTransaction();
              session.endSession();
            }
            return sendError(res, `Ticket type ${ticketReq.ticketTypeId} not found`, 400);
          }
          if (ticketType.availableQuantity < ticketReq.quantity) {
            if (session) {
              await session.abortTransaction();
              session.endSession();
            }
            return sendError(res, `Insufficient tickets available for ${ticketType.title}`, 400);
          }
          const ticketTotal = ticketType.price * ticketReq.quantity;
          subtotal += ticketTotal;
          bookingTickets.push({
            ticketTypeId: ticketType._id,
            ticketTypeTitle: ticketType.title,
            quantity: ticketReq.quantity,
            price: ticketType.price,
            totalAmount: ticketTotal,
          });
          // Reserve tickets
          ticketType.availableQuantity -= ticketReq.quantity;
        }
        await event.save(session ? { session } : {});

        // Apply offer
        let discount = 0;
        let offerId = null;
        if (offerCode) {
          const offerQuery = Offer.findOne({
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
          if (session) offerQuery.session(session);
          const offer = await offerQuery;

          if (offer) {
            const usageQuery = UsedCoupon.countDocuments({
              userId: req.user._id,
              offerId: offer._id,
            });
            if (session) usageQuery.session(session);
            const customerUsageCount = await usageQuery;
            
            if (!(offer.usageLimit && offer.usedCount >= offer.usageLimit) && 
                customerUsageCount < (offer.perCustomerLimit || 1) && 
                subtotal >= offer.minPurchaseAmount) {
              if (offer.type === 'flat') {
                discount = Math.min(offer.value, subtotal);
              } else if (offer.type === 'percentage') {
                discount = (subtotal * offer.value) / 100;
                if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
              }
              offerId = offer._id;
            }
          }
        }

        // Validate and link affiliate code if provided
        let affiliateLinkId = null;
        if (affiliateCode && typeof affiliateCode === 'string' && affiliateCode.trim() !== '') {
          try {
            const normalizedAffiliateCode = affiliateCode.toUpperCase().trim();
            const affiliateLinkQuery = AffiliateLink.findOne({
              affiliateCode: normalizedAffiliateCode,
              isActive: true,
            });
            if (session) affiliateLinkQuery.session(session);
            const affiliateLink = await affiliateLinkQuery;

            if (affiliateLink) {
              const affiliateEventId = affiliateLink.eventId?._id?.toString() || affiliateLink.eventId?.toString() || affiliateLink.eventId;
              const bookingEventId = eventId.toString();
              if (affiliateEventId === bookingEventId) {
                const referrerUserId = affiliateLink.referrerUserId?.toString() || affiliateLink.referrerUserId?._id?.toString();
                const bookingUserId = req.user._id.toString();
                if (referrerUserId !== bookingUserId) {
                  affiliateLinkId = affiliateLink._id;
                }
              }
            }
          } catch (error) {
            console.error('Error processing affiliate code in createOrder:', error);
          }
        }

        const totalAmount = subtotal - discount;
        const generatedBookingId = `PRIME${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const newBooking = await Booking.create([{
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
          paymentStatus: 'pending',
          status: 'pending',
        }], session ? { session } : {});

        booking = newBooking[0];
        booking.bookingModel = 'Booking';
        eventDoc = event;
      } else {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return sendError(res, 'eventId is required in bookingData', 400);
      }
    } else {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return sendError(res, 'Either bookingId or bookingData is required', 400);
    }

    if (booking.totalAmount === 0) {
      booking.paymentStatus = 'success';
      booking.status = 'confirmed';
      await booking.save(session ? { session } : {});
      
      if (session) {
        await session.commitTransaction();
        session.endSession();
      }
      
      return sendSuccess(res, 'Free booking processed successfully', {
        gateway: 'free',
        bookingId: booking._id,
        booking: booking
      });
    }

    // Determine gateway and credentials using the correct event object
    if (!eventDoc) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return sendError(res, 'Event details could not be resolved', 400);
    }

    const paymentConfig = eventDoc.paymentConfig || { gateway: 'razorpay' };
    const gateway = paymentConfig.gateway || 'razorpay';
    
    let orderDetails = {};

    if (gateway === 'razorpay') {
      // Razorpay flow (either event-specific or global)
      let rzpKeyId, rzpKeySecret;
      
      if (paymentConfig.razorpay && paymentConfig.razorpay.keyId) {
        rzpKeyId = paymentConfig.razorpay.keyId;
        rzpKeySecret = paymentConfig.razorpay.keySecret;
      } else {
        rzpKeyId = config.RAZORPAY_KEY_ID;
        rzpKeySecret = config.RAZORPAY_KEY_SECRET;
      }

      let isDummyMode = !rzpKeyId || !rzpKeySecret;
      let rzpInstance = razorpay;

      if (paymentConfig.razorpay && paymentConfig.razorpay.keyId && !isDummyMode) {
        rzpInstance = new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret });
      }

      if (isDummyMode) {
        orderDetails = {
          id: `order_dummy_${Date.now()}`,
          amount: Math.round(booking.totalAmount * 100),
          currency: 'INR',
          key: rzpKeyId || 'dummy_key',
          gateway: 'razorpay',
          isDummyMode: true
        };
      } else {
        const options = {
          amount: Math.round(booking.totalAmount * 100),
          currency: 'INR',
          receipt: booking.bookingId,
        };
        const rzpOrder = await rzpInstance.orders.create(options);
        orderDetails = {
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          key: rzpKeyId,
          gateway: 'razorpay'
        };
      }
    } else if (gateway === 'cashfree') {
      if (!paymentConfig.cashfree || !paymentConfig.cashfree.appId || !paymentConfig.cashfree.secretKey) {
        throw new Error('Cashfree credentials are missing for this event');
      }
      
      const cfAppId = paymentConfig.cashfree.appId;
      const cfSecretKey = paymentConfig.cashfree.secretKey;
      
      const cfService = new CashfreeService({ appId: cfAppId, secretKey: cfSecretKey });
      const cfOrder = await cfService.createOrder({
        orderId: `order_${booking.bookingId}_${Date.now()}`,
        amount: booking.totalAmount,
        customerId: req.user._id.toString(),
        customerEmail: req.user.email || 'customer@example.com',
        customerPhone: req.user.mobile,
      });

      orderDetails = {
        id: cfOrder.order_id,
        payment_session_id: cfOrder.payment_session_id,
        amount: cfOrder.order_amount,
        currency: cfOrder.order_currency,
        gateway: 'cashfree'
      };
    }

    // Update payment record or create one
    let paymentQuery = Payment.findOne({ bookingId: booking._id });
    if (session) paymentQuery.session(session);
    let payment = await paymentQuery;

    if (!payment) {
      const paymentData = {
        bookingId: booking._id,
        bookingModel: 'Booking',
        userId: req.user._id,
        amount: booking.totalAmount,
        status: 'pending',
        gateway: gateway
      };
      
      if (gateway === 'razorpay') paymentData.razorpayOrderId = orderDetails.id;
      if (gateway === 'cashfree') paymentData.cashfreeOrderId = orderDetails.id;
      
      const newPayment = await Payment.create([paymentData], session ? { session } : {});
      payment = newPayment[0];
    } else {
      payment.gateway = gateway;
      if (gateway === 'razorpay') payment.razorpayOrderId = orderDetails.id;
      if (gateway === 'cashfree') payment.cashfreeOrderId = orderDetails.id;
      await payment.save(session ? { session } : {});
    }

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return sendSuccess(res, 'Payment order created successfully', {
      gateway,
      orderData: orderDetails,
      paymentId: payment._id,
      bookingId: booking._id,
      keyId: gateway === 'razorpay' ? orderDetails.key : null,
      isTestMode: config.PAYMENT_MODE === 'sandbox'
    });
  } catch (error) {
    if (session) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
    }
    console.error('Error creating payment order:', error);
    return sendError(res, `Failed to create payment order: ${error.message}`, 500);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_id, // Cashfree typically sends order_id in return URL
      cf_order_id 
    } = req.body;

    let payment;
    let booking;
    let isDummyMode = false;
    let paymentDetails = {};

    if (razorpay_order_id) {
      payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
      if (!payment) return sendError(res, 'Payment record not found', 404);

      booking = await Booking.findById(payment.bookingId).populate('eventId');
      if (!booking) return sendError(res, 'Booking not found', 404);

      const event = booking?.eventId;
      const paymentConfig = event?.paymentConfig || { gateway: 'razorpay' };

      let rzpKeySecret = config.RAZORPAY_KEY_SECRET;
      if (paymentConfig.razorpay && paymentConfig.razorpay.keySecret) rzpKeySecret = paymentConfig.razorpay.keySecret;
      
      let rzpInstance = razorpay;
      if (paymentConfig.razorpay && paymentConfig.razorpay.keyId && rzpKeySecret) {
        const rzpKeyId = paymentConfig.razorpay.keyId;
        rzpInstance = new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret });
      }

      isDummyMode = !rzpKeySecret || razorpay_order_id.startsWith('order_dummy_');
      if (!isDummyMode) {
        if (!razorpay_payment_id || !razorpay_signature) return sendError(res, 'Payment verification data is required', 400);
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto.createHmac('sha256', rzpKeySecret).update(text).digest('hex');
        if (generatedSignature !== razorpay_signature) return sendError(res, 'Invalid payment signature', 400);
        paymentDetails = await rzpInstance.payments.fetch(razorpay_payment_id);
      } else {
        paymentDetails = { id: razorpay_payment_id || `pay_dummy_${Date.now()}`, method: 'card', status: 'authorized' };
      }

      payment.razorpayPaymentId = razorpay_payment_id || paymentDetails.id;
      payment.razorpaySignature = razorpay_signature || 'dummy_signature';
      payment.status = 'success';
      payment.paymentMethod = isDummyMode ? 'card' : (paymentDetails.method || 'card');
      payment.metadata = paymentDetails;
      await payment.save();

    } else if (order_id || cf_order_id) {
      const cashfreeOrderId = order_id || cf_order_id;
      payment = await Payment.findOne({ cashfreeOrderId: cashfreeOrderId });
      if (!payment) return sendError(res, 'Payment record not found', 404);

      booking = await Booking.findById(payment.bookingId).populate('eventId');
      if (!booking) return sendError(res, 'Booking not found', 404);

      const event = booking.eventId;
      const paymentConfig = event.paymentConfig || { gateway: 'razorpay' };
      
      let cfAppId, cfSecretKey;
      if (paymentConfig.cashfree && paymentConfig.cashfree.appId && paymentConfig.cashfree.secretKey) {
        cfAppId = paymentConfig.cashfree.appId;
        cfSecretKey = paymentConfig.cashfree.secretKey;
      } else {
        cfAppId = config.CASHFREE_APP_ID;
        cfSecretKey = config.CASHFREE_SECRET_KEY;
      }

      if (!cfAppId || !cfSecretKey) return sendError(res, 'Cashfree configuration missing for this event', 400);

      const cfService = new CashfreeService({ appId: cfAppId, secretKey: cfSecretKey });
      const cfOrder = await cfService.verifyPayment(cashfreeOrderId);

      if (cfOrder.order_status === 'PAID' || cfOrder.order_status === 'SUCCESS') {
        payment.status = 'success';
        payment.cashfreePaymentId = cfOrder.payments?.[0]?.cf_payment_id || 'manual_verify';
        payment.paymentMethod = cfOrder.payments?.[0]?.payment_group || 'card';
        payment.metadata = cfOrder;
        await payment.save();
      } else {
        return sendError(res, `Payment verification failed. Status: ${cfOrder.order_status}`, 400);
      }
    } else {
      return sendError(res, 'Order ID is required for verification', 400);
    }

    booking.paymentStatus = 'success';
    booking.status = 'confirmed';
    await booking.save();

    if (booking.offerId) {
      const offer = await Offer.findById(booking.offerId);
      if (offer) {
        offer.usedCount += 1;
        await offer.save();
        try {
          const existingUsedCoupon = await UsedCoupon.findOne({ userId: booking.userId, offerId: offer._id });
          if (!existingUsedCoupon) {
            await UsedCoupon.create({
              userId: booking.userId,
              offerId: offer._id,
              code: offer.code,
              bookingId: booking._id,
              eventId: booking.eventId,
              usedAt: new Date(),
            });
          } else {
            existingUsedCoupon.bookingId = booking._id;
            existingUsedCoupon.usedAt = new Date();
            await existingUsedCoupon.save();
          }
        } catch (err) {
          console.error('Error recording used coupon:', err);
        }
      }
    }

    return sendSuccess(res, 'Payment verified successfully', {
      payment,
      booking,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return sendError(res, `Failed to verify payment: ${error.message}`, 500);
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
    const { 
      bookingId, 
      bookingData, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      cf_order_id,
      cf_payment_id,
      amount, 
      paymentMethod,
      gateway = 'razorpay'
    } = req.body;

    // Support both flows: update existing booking OR create new booking
    let existingBooking = null;
    let eventId, slotId, tickets, offerCode, affiliateCode;

    if (bookingId) {
      existingBooking = await Booking.findById(bookingId).session(session);

      if (!existingBooking) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 'Booking not found', 404);
      }

      if (existingBooking.userId.toString() !== req.user._id.toString()) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 'Access denied', 403);
      }

      if (existingBooking.paymentStatus === 'success' || existingBooking.status === 'confirmed') {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 'Payment already completed for this booking', 400);
      }

      eventId = existingBooking.eventId?._id || existingBooking.eventId;
      slotId = existingBooking.slotId?._id || existingBooking.slotId;
      tickets = (existingBooking.tickets || []).map((t) => ({
        ticketTypeId: t.ticketTypeId,
        quantity: t.quantity,
      }));

      offerCode = existingBooking.offerId ? null : null;
      affiliateCode = existingBooking.affiliateLinkId ? null : null;
    } else if (bookingData) {
      if (!bookingData.eventId) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 'eventId is required in bookingData', 400);
      }
      ({ eventId, slotId, tickets, offerCode, affiliateCode } = bookingData);
    } else {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'Either bookingId or bookingData is required', 400);
    }

    const event = await Event.findById(eventId).session(session);

    if (!event || !event.isActive || event.status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'Event not found or not available', 404);
    }

    const slot = event.slots.id(slotId);
    if (!slot || !slot.isActive) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'Slot not found or not available', 404);
    }

    let createdBooking, totalAmount, subtotal, discount, offerId, affiliateLinkId, bookingTickets;

    if (existingBooking) {
      createdBooking = existingBooking;
      totalAmount = existingBooking.totalAmount;
      subtotal = existingBooking.subtotal;
      discount = existingBooking.discount || 0;
      offerId = existingBooking.offerId;
      affiliateLinkId = existingBooking.affiliateLinkId;
      bookingTickets = existingBooking.tickets;
    } else {
      subtotal = 0;
      bookingTickets = [];

      for (const ticketReq of tickets) {
        const ticketType = event.ticketTypes.id(ticketReq.ticketTypeId);
        if (!ticketType || !ticketType.isActive) {
          await session.abortTransaction();
          session.endSession();
          return sendError(res, `Ticket type ${ticketReq.ticketTypeId} not found`, 400);
        }
        const ticketTotalAmount = ticketType.price * ticketReq.quantity;
        subtotal += ticketTotalAmount;
        bookingTickets.push({
          ticketTypeId: ticketType._id,
          ticketTypeTitle: ticketType.title,
          quantity: ticketReq.quantity,
          price: ticketType.price,
          totalAmount: ticketTotalAmount,
        });
      }

      discount = 0;
      offerId = null;
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
          const perCustomerLimit = offer.perCustomerLimit || 1;
          const customerUsageCount = await UsedCoupon.countDocuments({
            userId: req.user._id,
            offerId: offer._id,
          }).session(session);
          
          if (!(offer.usageLimit && offer.usedCount >= offer.usageLimit) && 
              customerUsageCount < perCustomerLimit && 
              subtotal >= offer.minPurchaseAmount) {
            if (offer.type === 'flat') {
              discount = Math.min(offer.value, subtotal);
            } else if (offer.type === 'percentage') {
              discount = (subtotal * offer.value) / 100;
              if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
            }
            offerId = offer._id;
          }
        }
      }

      affiliateLinkId = null;
      if (affiliateCode && typeof affiliateCode === 'string' && affiliateCode.trim() !== '') {
        try {
          const normalizedAffiliateCode = affiliateCode.toUpperCase().trim();
          const affiliateLink = await AffiliateLink.findOne({
            affiliateCode: normalizedAffiliateCode,
            isActive: true,
          }).session(session);

          if (affiliateLink) {
            const affiliateEventId = affiliateLink.eventId?._id?.toString() || affiliateLink.eventId?.toString() || affiliateLink.eventId;
            const bookingEventId = eventId.toString();
            if (affiliateEventId === bookingEventId) {
              const referrerUserId = affiliateLink.referrerUserId?.toString() || affiliateLink.referrerUserId?._id?.toString();
              const bookingUserId = req.user._id.toString();
              if (referrerUserId !== bookingUserId) {
                affiliateLinkId = affiliateLink._id;
              }
            }
          }
        } catch (error) {
          console.error('Error processing affiliate code in storePayment:', error);
        }
      }

      totalAmount = subtotal - discount;
    }

    // Verify payment based on gateway
    let isPaymentVerified = false;
    let finalPaymentId = razorpay_payment_id || cf_payment_id;
    let finalOrderId = razorpay_order_id || cf_order_id;
    let finalGateway = gateway;

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const isFreeBooking = numAmount === 0;

    if (isFreeBooking) {
      isPaymentVerified = true;
      finalGateway = 'free';
    } else if (gateway === 'razorpay') {
      const paymentConfig = event.paymentConfig || { gateway: 'razorpay' };
      let rzpKeySecret = config.RAZORPAY_KEY_SECRET;
      if (paymentConfig.razorpay && paymentConfig.razorpay.keySecret) {
        rzpKeySecret = paymentConfig.razorpay.keySecret;
      }

      if (razorpay_order_id && razorpay_order_id.startsWith('order_dummy_')) {
        isPaymentVerified = true;
      } else if (razorpay_payment_id && razorpay_signature && rzpKeySecret) {
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto.createHmac('sha256', rzpKeySecret).update(text).digest('hex');
        isPaymentVerified = generatedSignature === razorpay_signature;
      }
    } else if (gateway === 'cashfree') {
      const cfAppId = event.paymentConfig.cashfree.appId;
      const cfSecretKey = event.paymentConfig.cashfree.secretKey;
      const cfService = new CashfreeService({ appId: cfAppId, secretKey: cfSecretKey });
      try {
        const cfOrder = await cfService.verifyPayment(cf_order_id);
        isPaymentVerified = cfOrder.order_status === 'PAID' || cfOrder.order_status === 'SUCCESS';
        if (cfOrder.payments && cfOrder.payments.length > 0) finalPaymentId = cfOrder.payments[0].cf_payment_id;
      } catch (err) {
        isPaymentVerified = false;
      }
    }

    if (!isPaymentVerified) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'Payment verification failed', 400);
    }

    if (!existingBooking) {
      for (const ticketReq of tickets) {
        const ticketType = event.ticketTypes.id(ticketReq.ticketTypeId);
        ticketType.availableQuantity -= ticketReq.quantity;
      }
      await event.save({ session });
      
      const generatedBookingId = `PRIME${Date.now()}${Math.floor(Math.random() * 1000)}`;
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
      createdBooking = booking[0];
    } else {
      createdBooking.paymentStatus = 'success';
      createdBooking.status = 'confirmed';
      await createdBooking.save({ session });
    }

    // Parse amount to number if it's a string
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Prepare payment record data
    const paymentData = {
      bookingId: createdBooking._id,
      bookingModel: 'Booking',
      userId: req.user._id,
      amount: createdBooking.totalAmount,
      status: 'success',
      paymentMethod: paymentMethod || 'upi',
      gateway: finalGateway,
      metadata: {
        tickets: tickets,
        offerCode: offerCode,
        affiliateCode: affiliateCode
      }
    };

    if (finalGateway === 'razorpay') {
      paymentData.razorpayOrderId = finalOrderId;
      paymentData.razorpayPaymentId = finalPaymentId;
      paymentData.razorpaySignature = razorpay_signature;
    } else if (finalGateway === 'cashfree') {
      paymentData.cashfreeOrderId = finalOrderId;
      paymentData.cashfreePaymentId = finalPaymentId;
    }

    let createdPayment;
    const existingPayment = await Payment.findOne({ bookingId: createdBooking._id }).session(session);

    if (existingPayment) {
      existingPayment.status = 'success';
      existingPayment.paymentMethod = paymentData.paymentMethod;
      existingPayment.gateway = paymentData.gateway;
      existingPayment.amount = paymentData.amount;
      existingPayment.metadata = { ...existingPayment.metadata, ...paymentData.metadata };
      
      if (finalGateway === 'razorpay') {
        existingPayment.razorpayOrderId = paymentData.razorpayOrderId;
        existingPayment.razorpayPaymentId = paymentData.razorpayPaymentId;
        existingPayment.razorpaySignature = paymentData.razorpaySignature;
      } else if (finalGateway === 'cashfree') {
        existingPayment.cashfreeOrderId = paymentData.cashfreeOrderId;
        existingPayment.cashfreePaymentId = paymentData.cashfreePaymentId;
      }
      
      await existingPayment.save({ session });
      createdPayment = existingPayment;
    } else {
      const payment = await Payment.create([paymentData], { session });
      createdPayment = payment[0];
    }

    if (!createdBooking.paymentId) {
      createdBooking.paymentId = createdPayment._id;
      await createdBooking.save({ session });
    }

    if (createdBooking.offerId) {
      const offer = await Offer.findById(createdBooking.offerId).session(session);
      if (offer) {
        offer.usedCount += 1;
        await offer.save({ session });
        try {
          const existingUsedCoupon = await UsedCoupon.findOne({ userId: createdBooking.userId, offerId: offer._id }).session(session);
          if (!existingUsedCoupon) {
            await UsedCoupon.create([{
              userId: createdBooking.userId,
              offerId: offer._id,
              code: offer.code,
              bookingId: createdBooking._id,
              eventId: createdBooking.eventId,
              usedAt: new Date(),
            }], { session });
          } else {
            existingUsedCoupon.bookingId = createdBooking._id;
            existingUsedCoupon.usedAt = new Date();
            await existingUsedCoupon.save({ session });
          }
        } catch (err) {
          console.error('Error recording used coupon in storePayment:', err);
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

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

