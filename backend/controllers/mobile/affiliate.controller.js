/**
 * Mobile API - Affiliate links controller for customer panel
 */
const AffiliateLink = require('../../models/AffiliateLink');
const Booking = require('../../models/Booking');
const Event = require('../../models/Event');
const { sendSuccess, sendError } = require('../../utils/response');

const getMyAffiliateLinks = async (req, res) => {
  try {
    const affiliateLinks = await AffiliateLink.find({
      referrerUserId: req.user._id,
      isActive: true,
    })
      .populate('eventId', 'title')
      .populate('bookingId', 'bookingId totalAmount createdAt')
      .sort({ createdAt: -1 });

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

    const referrals = await Booking.find({
      affiliateLinkId: affiliateLink._id,
      paymentStatus: 'success',
    })
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 });

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

const getReferrals = async (req, res) => {
  try {
    const { linkId } = req.params;

    const affiliateLink = await AffiliateLink.findById(linkId);

    if (!affiliateLink) {
      return sendError(res, 'Affiliate link not found', 404);
    }

    const event = await Event.findById(affiliateLink.eventId).populate('organizer.organizerId', '_id');

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

module.exports = {
  getMyAffiliateLinks,
  getAffiliateLinkDetails,
  getReferrals,
};
