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

// Get sponsor by ID
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
    const sponsorData = req.body;

    // Parse socialMedia if it's a string
    if (sponsorData.socialMedia && typeof sponsorData.socialMedia === 'string') {
      try {
        sponsorData.socialMedia = JSON.parse(sponsorData.socialMedia);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    // Handle logo file upload
    if (req.file) {
      sponsorData.logo = `/uploads/sponsors/${req.file.filename}`;
    }

    const sponsor = await Sponsor.create({
      ...sponsorData,
      createdBy: req.user._id,
      createdByRole: req.user.role,
    });

    return sendSuccess(res, 'Sponsor created successfully', { sponsor }, 201);
  } catch (error) {
    console.error('Error creating sponsor:', error);
    return sendError(res, error.message || 'Failed to create sponsor', 500);
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
      // Organizer can update if:
      // 1. They created the sponsor, OR
      // 2. Sponsor is assigned to their events (admin assigned)
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

    const updateData = req.body;

    // Parse socialMedia if it's a string
    if (updateData.socialMedia && typeof updateData.socialMedia === 'string') {
      try {
        updateData.socialMedia = JSON.parse(updateData.socialMedia);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    // Handle logo file upload
    if (req.file) {
      updateData.logo = `/uploads/sponsors/${req.file.filename}`;
    }

    Object.assign(sponsor, updateData);
    await sponsor.save();

    return sendSuccess(res, 'Sponsor updated successfully', { sponsor });
  } catch (error) {
    console.error('Error updating sponsor:', error);
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

    // Check permissions - only creator can delete
    if (req.user.role === 'organizer') {
      if (sponsor.createdBy.toString() !== req.user._id.toString() || 
          sponsor.createdByRole !== 'organizer') {
        return sendError(res, 'You can only delete your own sponsors', 403);
      }
    }

    // Soft delete
    sponsor.isActive = false;
    await sponsor.save();

    return sendSuccess(res, 'Sponsor deleted successfully');
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    return sendError(res, error.message || 'Failed to delete sponsor', 500);
  }
};

module.exports = {
  getAllSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor,
};

