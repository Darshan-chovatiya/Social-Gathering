/**
 * Mobile API - Public controller (no auth) for customer panel
 */
const Event = require('../../models/Event');
const Category = require('../../models/Category');
const Offer = require('../../models/Offer');
const AffiliateLink = require('../../models/AffiliateLink');
const { sendSuccess, sendError } = require('../../utils/response');

const getAllEvents = async (req, res) => {
  try {
    const {
      category,
      location,
      search,
      date,
      minPrice,
      maxPrice,
      status = 'approved',
      page = 1,
      limit = 10,
    } = req.query;

    const query = { isActive: true, status };

    if (category) {
      const categoryDoc = await Category.findOne({ name: new RegExp(category, 'i') });
      if (categoryDoc) {
        query.categories = categoryDoc._id;
      }
    }

    if (location) {
      query['address.city'] = new RegExp(location, 'i');
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    if (date) {
      query['slots.date'] = { $gte: new Date(date) };
    }

    const events = await Event.find(query)
      .populate('categories', 'name')
      .populate('sponsors', 'name logo type website socialMedia')
      .populate('organizer.organizerId', 'name email mobile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    let filteredEvents = events;
    if (minPrice || maxPrice) {
      filteredEvents = events.filter(event => {
        const minTicketPrice = Math.min(...event.ticketTypes.map(t => t.price));
        const maxTicketPrice = Math.max(...event.ticketTypes.map(t => t.price));
        if (minPrice && maxTicketPrice < minPrice) return false;
        if (maxPrice && minTicketPrice > maxPrice) return false;
        return true;
      });
    }

    const total = await Event.countDocuments(query);

    return sendSuccess(res, 'Events fetched successfully', {
      events: filteredEvents,
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

const getFeaturedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      isActive: true,
      status: 'approved',
      isFeatured: true,
    })
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    return sendSuccess(res, 'Featured events fetched successfully', {
      events,
    });
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return sendError(res, 'Failed to fetch featured events', 500);
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('categories', 'name')
      .populate('sponsors', 'name logo type website socialMedia')
      .populate('organizer.organizerId', 'name email mobile');

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (req.user && req.user.role === 'organizer') {
      let organizerId;
      if (event.organizer.organizerId && typeof event.organizer.organizerId === 'object' && event.organizer.organizerId._id) {
        organizerId = event.organizer.organizerId._id.toString();
      } else {
        organizerId = event.organizer.organizerId.toString();
      }
      const userId = req.user._id.toString();
      if (organizerId !== userId) {
        return sendError(res, 'Access denied. You can only view your own events.', 403);
      }
    }

    return sendSuccess(res, 'Event fetched successfully', { event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return sendError(res, 'Failed to fetch event', 500);
  }
};

const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      isActive: true,
      status: 'approved',
      banners: { $exists: true, $ne: [] },
    })
      .populate('categories', 'name')
      .populate('organizer.organizerId', 'name')
      .select('title banners slots address categories organizer')
      .lean();

    const activeBanners = events
      .filter(event => {
        if (!event.slots || event.slots.length === 0) return false;
        const hasFutureSlot = event.slots.some(slot => {
          const slotDate = new Date(slot.date);
          const [hours, minutes] = slot.endTime.split(':').map(Number);
          slotDate.setHours(hours, minutes, 0, 0);
          return slotDate >= now;
        });
        return hasFutureSlot;
      })
      .map(event => ({
        _id: event._id,
        title: event.title,
        banners: event.banners,
        address: event.address,
        categories: event.categories,
        organizer: event.organizer,
        slots: event.slots,
      }));

    return sendSuccess(res, 'Active banners fetched successfully', {
      banners: activeBanners,
      count: activeBanners.length,
    });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return sendError(res, 'Failed to fetch active banners', 500);
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('-createdBy')
      .sort({ name: 1 });

    return sendSuccess(res, 'Categories fetched successfully', {
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return sendError(res, 'Failed to fetch categories', 500);
  }
};

const getEventOffers = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    const now = new Date();

    const orConditions = [
      { eventId: event._id },
    ];
    if (event.categories && event.categories.length > 0) {
      orConditions.push({ categoryId: { $in: event.categories } });
    }
    orConditions.push({
      $and: [
        { $or: [{ eventId: null }, { eventId: { $exists: false } }] },
        { $or: [{ categoryId: null }, { categoryId: { $exists: false } }] }
      ]
    });

    const query = {
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: orConditions,
      $expr: {
        $or: [
          { $eq: ['$usageLimit', null] },
          { $lt: ['$usedCount', '$usageLimit'] },
        ],
      },
    };

    const offers = await Offer.find(query).sort({ createdAt: -1 });

    return sendSuccess(res, 'Offers fetched successfully', { offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return sendError(res, 'Failed to fetch offers', 500);
  }
};

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

module.exports = {
  getAllEvents,
  getFeaturedEvents,
  getEventById,
  getActiveBanners,
  getAllCategories,
  getEventOffers,
  getAffiliateLinkByCode,
};
