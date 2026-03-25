const AffiliateLink = require('../models/AffiliateLink');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

// Create affiliate link for a booking (organizer only)
const createAffiliateLink = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return sendError(res, 'Booking ID is required', 400);
    }

    // Get booking with event details
    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'eventId',
        select: 'organizer',
        populate: {
          path: 'organizer.organizerId',
          select: '_id',
        },
      });

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    // Check if booking payment is successful
    if (booking.paymentStatus !== 'success' || booking.status !== 'confirmed') {
      return sendError(res, 'Affiliate link can only be created for bookings with successful payment', 400);
    }

    // Verify event belongs to organizer
    if (!booking.eventId) {
      return sendError(res, 'Associated event not found for this booking', 404);
    }
    const eventOrganizerId = booking.eventId.organizer?.organizerId?._id || booking.eventId.organizer?.organizerId || booking.eventId.organizer;
    if (!eventOrganizerId || eventOrganizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. This event does not belong to you', 403);
    }

    // Get event ID
    const eventId = booking.eventId._id || booking.eventId;
    const referrerUserId = booking.userId;

    // Check if affiliate link already exists for this customer and event
    // (One affiliate link per customer per event, even if they have multiple bookings)
    const existingLink = await AffiliateLink.findOne({ 
      referrerUserId: referrerUserId,
      eventId: eventId,
      isActive: true 
    })
      .populate('eventId', '_id');
    
    if (existingLink) {
      const existingEventId = (existingLink.eventId && typeof existingLink.eventId === 'object') ? existingLink.eventId._id : existingLink.eventId;
      return sendSuccess(res, 'Affiliate link already exists for this customer and event', {
        affiliateLink: existingLink,
        affiliateUrl: existingEventId ? `${process.env.FRONTEND_URL || 'https://socialgathering.in'}/#/events/${existingEventId}?ref=${existingLink.affiliateCode}` : null,
      });
    }

    // Generate unique affiliate code
    let affiliateCode;
    let isUnique = false;
    const crypto = require('crypto');
    
    while (!isUnique) {
      // Generate 8-character alphanumeric code
      affiliateCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Check if code already exists
      const existing = await AffiliateLink.findOne({ affiliateCode });
      if (!existing) {
        isUnique = true;
      }
    }

    // Create affiliate link (only if no existing link for this customer+event)
    try {
      const affiliateLink = new AffiliateLink({
        affiliateCode,
        referrerUserId: referrerUserId,
        eventId: eventId,
        bookingId: booking._id, // Store the booking that was used to create this link
        isActive: true,
        updatedAt: Date.now(),
      });
      await affiliateLink.save();

      const affiliateUrl = `${process.env.FRONTEND_URL || 'https://socialgathering.in'}/#/events/${eventId}?ref=${affiliateLink.affiliateCode}`;

      return sendSuccess(res, 'Affiliate link created successfully', {
        affiliateLink,
        affiliateUrl,
      });
    } catch (saveError) {
      // Handle duplicate key error (race condition or deactivated link)
      if (saveError.code === 11000) {
        // Link was created by another request or exists (possibly deactivated)
        // Try to find it again
        const existingLink = await AffiliateLink.findOne({ 
          referrerUserId: referrerUserId,
          eventId: eventId,
        })
          .populate('eventId', '_id');
        
        if (existingLink) {
          const existingEventId = (existingLink.eventId && typeof existingLink.eventId === 'object') ? existingLink.eventId._id : existingLink.eventId;
          return sendSuccess(res, 'Affiliate link already exists for this customer and event', {
            affiliateLink: existingLink,
            affiliateUrl: existingEventId ? `${process.env.FRONTEND_URL || 'https://socialgathering.in'}/#/events/${existingEventId}?ref=${existingLink.affiliateCode}` : null,
          });
        }
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    return sendError(res, 'Failed to create affiliate link', 500);
  }
};

// Get affiliate link by code (public - for validation)
const getAffiliateLinkByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const affiliateLink = await AffiliateLink.findOne({
      affiliateCode: code.toUpperCase(),
      isActive: true,
    })
      .populate('eventId', 'title status isActive')
      .populate('referrerUserId', 'name email mobile');

    if (!affiliateLink) {
      return sendError(res, 'Invalid or inactive affiliate code', 404);
    }

    // Check if event is still active and approved
    if (!affiliateLink.eventId.isActive || affiliateLink.eventId.status !== 'approved') {
      return sendError(res, 'Event is no longer available', 400);
    }

    return sendSuccess(res, 'Affiliate link found', {
      affiliateLink: {
        code: affiliateLink.affiliateCode,
        eventId: affiliateLink.eventId?._id,
        eventTitle: affiliateLink.eventId?.title,
        referrerName: affiliateLink.referrerUserId?.name,
      },
    });
  } catch (error) {
    console.error('Error fetching affiliate link:', error);
    return sendError(res, 'Failed to fetch affiliate link', 500);
  }
};

// Get affiliate link details with referrals (organizer/user)
const getAffiliateLinkDetails = async (req, res) => {
  try {
    const { linkId } = req.params;

    const affiliateLink = await AffiliateLink.findById(linkId)
      .populate('referrerUserId', 'name email mobile')
      .populate('eventId', 'title')
      .populate('bookingId', 'bookingId totalAmount createdAt');

    if (!affiliateLink) {
      return sendError(res, 'Affiliate link not found', 404);
    }

    // Get event to check organizer
    const eventId = (affiliateLink.eventId && typeof affiliateLink.eventId === 'object') ? affiliateLink.eventId._id : affiliateLink.eventId;
    const event = await Event.findById(eventId).populate('organizer.organizerId', '_id');
    
    if (!event) {
      return sendError(res, 'Associated event not found', 404);
    }

    const eventOrganizerId = event.organizer?.organizerId?._id || event.organizer?.organizerId || event.organizer;
    const isOrganizer = req.user.role === 'organizer' && eventOrganizerId?.toString() === req.user._id.toString();
    const isReferrer = affiliateLink.referrerUserId._id.toString() === req.user._id.toString();

    if (!isOrganizer && !isReferrer) {
      return sendError(res, 'Access denied', 403);
    }

    // Get referrals (bookings that used this affiliate link)
    const referrals = await Booking.find({
      affiliateLinkId: affiliateLink._id,
      paymentStatus: 'success',
    })
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalReferrals = referrals.length;
    const totalRevenue = referrals.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    const eventIdForUrl = (affiliateLink.eventId && typeof affiliateLink.eventId === 'object') ? affiliateLink.eventId._id : affiliateLink.eventId;
    const affiliateUrl = eventIdForUrl ? `${process.env.FRONTEND_URL || 'https://socialgathering.in'}/#/events/${eventIdForUrl}?ref=${affiliateLink.affiliateCode}` : null;

    return sendSuccess(res, 'Affiliate link details fetched successfully', {
      affiliateLink: {
        ...affiliateLink.toObject(),
        affiliateUrl,
      },
      referrer: affiliateLink.referrerUserId,
      originalBooking: affiliateLink.bookingId,
      statistics: {
        totalReferrals,
        totalRevenue,
      },
      referrals: referrals.map(ref => ({
        bookingId: ref.bookingId,
        userId: ref.userId,
        totalAmount: ref.totalAmount,
        createdAt: ref.createdAt,
        status: ref.status,
        paymentStatus: ref.paymentStatus,
      })),
    });
  } catch (error) {
    console.error('Error fetching affiliate link details:', error);
    return sendError(res, 'Failed to fetch affiliate link details', 500);
  }
};

// Get referrals list for an affiliate link
const getReferrals = async (req, res) => {
  try {
    const { linkId } = req.params;

    const affiliateLink = await AffiliateLink.findById(linkId);

    if (!affiliateLink) {
      return sendError(res, 'Affiliate link not found', 404);
    }

    // Check access
    const event = await Event.findById(affiliateLink.eventId).populate('organizer.organizerId', '_id');
    
    // If event is missing, only the referrer can see the referrals
    const isReferrer = affiliateLink.referrerUserId.toString() === req.user._id.toString();
    let isOrganizer = false;

    if (event) {
      const eventOrganizerId = event.organizer?.organizerId?._id || event.organizer?.organizerId || event.organizer;
      isOrganizer = req.user.role === 'organizer' && eventOrganizerId?.toString() === req.user._id.toString();
    }

    if (!isOrganizer && !isReferrer) {
      return sendError(res, 'Access denied', 403);
    }

    const referrals = await Booking.find({
      affiliateLinkId: affiliateLink._id,
      paymentStatus: 'success',
    })
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Referrals fetched successfully', {
      referrals: referrals.map(ref => ({
        bookingId: ref.bookingId,
        user: ref.userId,
        totalAmount: ref.totalAmount,
        createdAt: ref.createdAt,
        status: ref.status,
        paymentStatus: ref.paymentStatus,
      })),
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return sendError(res, 'Failed to fetch referrals', 500);
  }
};

// Deactivate affiliate link (organizer)
const deactivateAffiliateLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const affiliateLink = await AffiliateLink.findById(linkId)
      .populate('eventId', 'organizer');

    if (!affiliateLink) {
      return sendError(res, 'Affiliate link not found', 404);
    }

    // Get event to verify organizer
    const event = await Event.findById(affiliateLink.eventId).populate('organizer.organizerId', '_id');
    
    if (!event) {
      return sendError(res, 'Associated event not found', 404);
    }

    const eventOrganizerId = event.organizer?.organizerId?._id || event.organizer?.organizerId || event.organizer;
    if (!eventOrganizerId || eventOrganizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. This event does not belong to you', 403);
    }

    affiliateLink.isActive = false;
    await affiliateLink.save();

    return sendSuccess(res, 'Affiliate link deactivated successfully', {
      affiliateLink,
    });
  } catch (error) {
    console.error('Error deactivating affiliate link:', error);
    return sendError(res, 'Failed to deactivate affiliate link', 500);
  }
};

// Check if affiliate link exists for customer and event (organizer only)
const checkAffiliateLinkExists = async (req, res) => {
  try {
    const { userId, eventId } = req.query;

    if (!userId || !eventId) {
      return sendError(res, 'User ID and Event ID are required', 400);
    }

    // Verify event belongs to organizer
    const event = await Event.findById(eventId).populate('organizer.organizerId', '_id');
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    const eventOrganizerId = event.organizer?.organizerId?._id || event.organizer?.organizerId || event.organizer;
    if (!eventOrganizerId || eventOrganizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. This event does not belong to you', 403);
    }

    // Check if affiliate link exists
    const affiliateLink = await AffiliateLink.findOne({
      referrerUserId: userId,
      eventId: eventId,
      isActive: true,
    })
      .populate('referrerUserId', 'name email mobile')
      .populate('eventId', 'title');

    if (!affiliateLink) {
      return sendSuccess(res, 'Affiliate link does not exist', {
        exists: false,
      });
    }

    // Get statistics
    const referrals = await Booking.find({
      affiliateLinkId: affiliateLink._id,
      paymentStatus: 'success',
    });

    const totalReferrals = referrals.length;
    const totalRevenue = referrals.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    const eventIdForUrl = (affiliateLink.eventId && typeof affiliateLink.eventId === 'object') ? affiliateLink.eventId._id : affiliateLink.eventId;
    const affiliateUrl = eventIdForUrl ? `${process.env.FRONTEND_URL || 'https://socialgathering.in'}/#/events/${eventIdForUrl}?ref=${affiliateLink.affiliateCode}` : null;

    return sendSuccess(res, 'Affiliate link exists', {
      exists: true,
      affiliateLink: {
        ...affiliateLink.toObject(),
        affiliateUrl,
      },
      statistics: {
        totalReferrals,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Error checking affiliate link:', error);
    return sendError(res, 'Failed to check affiliate link', 500);
  }
};

// Get user's affiliate links
const getMyAffiliateLinks = async (req, res) => {
  try {
    const affiliateLinks = await AffiliateLink.find({
      referrerUserId: req.user._id,
      isActive: true,
    })
      .populate('eventId', 'title')
      .populate('bookingId', 'bookingId totalAmount createdAt')
      .sort({ createdAt: -1 });

    // Get referral counts and revenue for each link
    const linksWithStats = await Promise.all(
      affiliateLinks.map(async (link) => {
        const referrals = await Booking.find({
          affiliateLinkId: link._id,
          paymentStatus: 'success',
        });

        const totalReferrals = referrals.length;
        const totalRevenue = referrals.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

        const eventIdForUrl = (link.eventId && typeof link.eventId === 'object') ? link.eventId._id : link.eventId;
        const affiliateUrl = eventIdForUrl ? `${process.env.FRONTEND_URL || 'https://socialgathering.in'}/#/events/${eventIdForUrl}?ref=${link.affiliateCode}` : null;

        return {
          ...link.toObject(),
          affiliateUrl,
          statistics: {
            totalReferrals,
            totalRevenue,
          },
        };
      })
    );

    return sendSuccess(res, 'Affiliate links fetched successfully', {
      affiliateLinks: linksWithStats,
    });
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    return sendError(res, 'Failed to fetch affiliate links', 500);
  }
};

module.exports = {
  createAffiliateLink,
  getAffiliateLinkByCode,
  getAffiliateLinkDetails,
  getReferrals,
  deactivateAffiliateLink,
  getMyAffiliateLinks,
  checkAffiliateLinkExists,
};

