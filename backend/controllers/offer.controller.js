const Offer = require('../models/Offer');
const Event = require('../models/Event');
const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/response');

const getEventOffers = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    const now = new Date();
    
    // Build query conditions
    const orConditions = [
      // Event-specific offers
      { eventId: event._id },
    ];

    // Category-based offers that match event's categories
    // This includes both event-specific offers with categoryId and global offers with categoryId
    if (event.categories && event.categories.length > 0) {
      orConditions.push({ categoryId: { $in: event.categories } });
    }

    // Pure global offers (eventId is null AND categoryId is null)
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

const getAllOffers = async (req, res) => {
  try {
    const query = {};
    
    if (req.user.role === 'organizer') {
      // Get all events created by this organizer
      const organizerEvents = await Event.find({ 
        'organizer.organizerId': req.user._id 
      }).select('_id');
      
      const organizerEventIds = organizerEvents.map(event => event._id);
      
      // Organizers can see:
      // 1. Offers created by themselves
      // 2. Offers created for their events (by admin or others)
      // 3. Global offers (no eventId) created by admin
      const orConditions = [
        { createdBy: req.user._id, createdByRole: 'organizer' }, // Own offers
      ];
      
      // Add offers for their events if organizer has events
      if (organizerEventIds.length > 0) {
        orConditions.push({ eventId: { $in: organizerEventIds } }); // Offers for their events
      }
      
      // Add global admin offers (eventId is null or doesn't exist)
      orConditions.push({ 
        $and: [
          { $or: [{ eventId: null }, { eventId: { $exists: false } }] },
          { createdByRole: 'admin' }
        ]
      });
      
      query.$or = orConditions;
    }

    const offers = await Offer.find(query)
      .populate('eventId', 'title')
      .populate('categoryId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Offers fetched successfully', { offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return sendError(res, 'Failed to fetch offers', 500);
  }
};

const createOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      value,
      minPurchaseAmount,
      eventId,
      categoryId,
      slotId,
      validFrom,
      validUntil,
      usageLimit,
      perCustomerLimit,
      code,
    } = req.body;

    // Validate event (if provided)
    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) {
        return sendError(res, 'Event not found', 404);
      }

      // Organizers can only create offers for their own events
      if (req.user.role === 'organizer' && event.organizer.organizerId.toString() !== req.user._id.toString()) {
        return sendError(res, 'You can only create offers for your own events', 403);
      }
    }

    // Validate category (if provided)
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return sendError(res, 'Category not found', 404);
      }
    }

    // Check if code is unique (if provided)
    if (code) {
      const existingOffer = await Offer.findOne({ code: code.toUpperCase() });
      if (existingOffer) {
        return sendError(res, 'Offer code already exists', 400);
      }
    }

    const offer = await Offer.create({
      title,
      description,
      type,
      value,
      minPurchaseAmount: minPurchaseAmount || 0,
      createdBy: req.user._id,
      createdByRole: req.user.role,
      eventId: eventId || null,
      categoryId: categoryId || null,
      slotId: slotId || null,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit: usageLimit || null,
      perCustomerLimit: perCustomerLimit || 1,
      code: code ? code.toUpperCase() : null,
    });

    return sendSuccess(res, 'Offer created successfully', { offer }, 201);
  } catch (error) {
    console.error('Error creating offer:', error);
    return sendError(res, 'Failed to create offer', 500);
  }
};

const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return sendError(res, 'Offer not found', 404);
    }

    // Check permissions
    if (
      req.user.role === 'organizer' &&
      (offer.createdBy.toString() !== req.user._id.toString() || offer.createdByRole !== 'organizer')
    ) {
      return sendError(res, 'You can only update your own offers', 403);
    }

    const updateData = req.body;
    
    // Handle date conversions
    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }
    
    // Handle code
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      const existingOffer = await Offer.findOne({
        code: updateData.code,
        _id: { $ne: offer._id },
      });
      if (existingOffer) {
        return sendError(res, 'Offer code already exists', 400);
      }
    }

    Object.assign(offer, updateData);
    await offer.save();

    return sendSuccess(res, 'Offer updated successfully', { offer });
  } catch (error) {
    console.error('Error updating offer:', error);
    return sendError(res, 'Failed to update offer', 500);
  }
};

const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return sendError(res, 'Offer not found', 404);
    }

    // Check permissions
    if (
      req.user.role === 'organizer' &&
      (offer.createdBy.toString() !== req.user._id.toString() || offer.createdByRole !== 'organizer')
    ) {
      return sendError(res, 'You can only delete your own offers', 403);
    }

    // Check if offer has been used
    if (offer.usedCount && offer.usedCount > 0) {
      return sendError(res, `Cannot delete offer. This offer has been used ${offer.usedCount} time(s). You can only delete offers that have not been used.`, 400);
    }

    // Actually delete the offer from database
    await Offer.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 'Offer deleted successfully');
  } catch (error) {
    console.error('Error deleting offer:', error);
    return sendError(res, error.message || 'Failed to delete offer', 500);
  }
};

module.exports = {
  getEventOffers,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
};

