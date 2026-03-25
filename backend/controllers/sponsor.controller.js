const Sponsor = require('../models/Sponsor');
const Event = require('../models/Event');
const { sendSuccess, sendError } = require('../utils/response');

// Get all sponsors (admin sees all, organizer sees their own + assigned)
const getAllSponsors = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    let query = {};

    if (req.user.role === 'organizer') {
      // Get all events created by this organizer
      const organizerEvents = await Event.find({
        'organizer.organizerId': req.user._id
      }).select('_id');
      
      const organizerEventIds = organizerEvents.map(event => event._id);

      // Organizers can see:
      // 1. Sponsors created by themselves
      // 2. Sponsors assigned to their events (by admin or others)
      const orConditions = [];

      // Own sponsors
      if (includeInactive !== 'true') {
        orConditions.push({ 
          createdBy: req.user._id, 
          createdByRole: 'organizer',
          isActive: true 
        });
      } else {
        orConditions.push({ 
          createdBy: req.user._id, 
          createdByRole: 'organizer'
        });
      }

      // Add sponsors assigned to their events if organizer has events
      if (organizerEventIds.length > 0) {
        if (includeInactive !== 'true') {
          orConditions.push({ 
            assignedToEvents: { $in: organizerEventIds },
            isActive: true 
          });
        } else {
          orConditions.push({ 
            assignedToEvents: { $in: organizerEventIds }
          });
        }
      }

      query.$or = orConditions;
    } else {
      // Admin sees all sponsors
      if (includeInactive !== 'true') {
        query.isActive = true;
      }
    }

    const sponsors = await Sponsor.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Sponsors fetched successfully', { sponsors });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return sendError(res, 'Failed to fetch sponsors', 500);
  }
};

// Get sponsor by ID (for users - public access to active sponsors)
const getSponsorByIdForUsers = async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);

    if (!sponsor) {
      return sendError(res, 'Sponsor not found', 404);
    }

    // Users can only see active sponsors
    if (!sponsor.isActive) {
      return sendError(res, 'Sponsor not found', 404);
    }

    return sendSuccess(res, 'Sponsor fetched successfully', { sponsor });
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    return sendError(res, 'Failed to fetch sponsor', 500);
  }
};

// Get sponsor by ID (for admin/organizer - with permissions)
const getSponsorById = async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedToEvents', 'title');

    if (!sponsor) {
      return sendError(res, 'Sponsor not found', 404);
    }

    // Check permissions
    if (req.user.role === 'organizer') {
      // Check if sponsor is created by organizer OR assigned to their events
      const isOwner = sponsor.createdBy._id.toString() === req.user._id.toString() && 
                      sponsor.createdByRole === 'organizer';
      
      if (!isOwner) {
        // Check if sponsor is assigned to any of organizer's events
        const organizerEvents = await Event.find({
          'organizer.organizerId': req.user._id
        }).select('_id');
        
        const organizerEventIds = organizerEvents.map(event => event._id.toString());
        const assignedEventIds = sponsor.assignedToEvents.map(event => event._id.toString());
        
        const isAssigned = assignedEventIds.some(eventId => organizerEventIds.includes(eventId));
        
        if (!isAssigned) {
          return sendError(res, 'Access denied. You can only view your own sponsors or sponsors assigned to your events.', 403);
        }
      }
    }

    return sendSuccess(res, 'Sponsor fetched successfully', { sponsor });
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    return sendError(res, 'Failed to fetch sponsor', 500);
  }
};

// Create sponsor
const createSponsor = async (req, res) => {
  try {
    const sponsorData = {
      name: req.body.name,
      type: req.body.type,
      website: req.body.website,
      socialMedia: req.body.socialMedia ? JSON.parse(req.body.socialMedia) : {},
      description: req.body.description,
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : true,
      createdBy: req.user._id,
      createdByRole: req.user.role,
    };

    if (req.file) {
      sponsorData.logo = `/uploads/sponsors/${req.file.filename}`;
    }

    // Parse assignedToEvents if provided
    if (req.body.assignedToEvents) {
      try {
        sponsorData.assignedToEvents = JSON.parse(req.body.assignedToEvents);
      } catch (e) {
        // If it's already an array, use it directly
        if (Array.isArray(req.body.assignedToEvents)) {
          sponsorData.assignedToEvents = req.body.assignedToEvents;
        }
      }
    }

    const sponsor = await Sponsor.create(sponsorData);
    
    return sendSuccess(res, 'Sponsor created successfully', { sponsor }, 201);
  } catch (error) {
    console.error('Error creating sponsor:', error);
    return sendError(res, 'Failed to create sponsor', 500);
  }
};

// Update sponsor
const updateSponsor = async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);

    if (!sponsor) {
      return sendError(res, 'Sponsor not found', 404);
    }

    // Check permissions
    if (req.user.role === 'organizer') {
      const isOwner = sponsor.createdBy.toString() === req.user._id.toString() && 
                      sponsor.createdByRole === 'organizer';
      
      if (!isOwner) {
        // Check if sponsor is assigned to any of organizer's events
        const organizerEvents = await Event.find({
          'organizer.organizerId': req.user._id
        }).select('_id');
        
        const organizerEventIds = organizerEvents.map(event => event._id.toString());
        const assignedEventIds = sponsor.assignedToEvents.map(event => event.toString());
        
        const isAssigned = assignedEventIds.some(eventId => organizerEventIds.includes(eventId));
        
        if (!isAssigned) {
          return sendError(res, 'Access denied. You can only update your own sponsors or sponsors assigned to your events.', 403);
        }
      }
    }

    const updateData = {};

    // Only update fields that are provided
    if (req.body.name !== undefined) {
      updateData.name = req.body.name.trim();
    }
    
    if (req.body.type !== undefined) {
      updateData.type = req.body.type;
    }
    
    if (req.body.website !== undefined) {
      updateData.website = req.body.website ? req.body.website.trim() : null;
    }
    
    if (req.body.socialMedia !== undefined) {
      try {
        updateData.socialMedia = typeof req.body.socialMedia === 'string' 
          ? JSON.parse(req.body.socialMedia) 
          : req.body.socialMedia;
      } catch (e) {
        updateData.socialMedia = sponsor.socialMedia; // Keep existing if parse fails
      }
    }
    
    if (req.body.description !== undefined) {
      updateData.description = req.body.description;
    }

    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }

    if (req.file) {
      updateData.logo = `/uploads/sponsors/${req.file.filename}`;
    }

    // Parse assignedToEvents if provided
    if (req.body.assignedToEvents !== undefined) {
      try {
        updateData.assignedToEvents = typeof req.body.assignedToEvents === 'string'
          ? JSON.parse(req.body.assignedToEvents)
          : req.body.assignedToEvents;
      } catch (e) {
        if (Array.isArray(req.body.assignedToEvents)) {
          updateData.assignedToEvents = req.body.assignedToEvents;
        }
      }
    }

    // Update sponsor with validation
    Object.assign(sponsor, updateData);
    await sponsor.save();

    return sendSuccess(res, 'Sponsor updated successfully', { sponsor });
  } catch (error) {
    console.error('Error updating sponsor:', error);
    
    // Provide more detailed error message
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message).join(', ');
      return sendError(res, `Validation error: ${errors}`, 400);
    }
    
    return sendError(res, error.message || 'Failed to update sponsor', 500);
  }
};

// Delete sponsor
const deleteSponsor = async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);

    if (!sponsor) {
      return sendError(res, 'Sponsor not found', 404);
    }

    // Check permissions
    if (req.user.role === 'organizer') {
      if (sponsor.createdBy.toString() !== req.user._id.toString() || sponsor.createdByRole !== 'organizer') {
        return sendError(res, 'Access denied. You can only delete your own sponsors.', 403);
      }
    }

    await Sponsor.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 'Sponsor deleted successfully');
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    return sendError(res, 'Failed to delete sponsor', 500);
  }
};

module.exports = {
  getAllSponsors,
  getSponsorById,
  getSponsorByIdForUsers,
  createSponsor,
  updateSponsor,
  deleteSponsor,
};
