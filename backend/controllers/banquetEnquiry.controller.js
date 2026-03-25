const BanquetEnquiry = require('../models/BanquetEnquiry');
const Banquet = require('../models/Banquet');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Customer: Submit an enquiry for a banquet
 */
const createEnquiry = async (req, res) => {
  try {
    const { banquetId, name, mobile, email, message } = req.body;

    if (!banquetId || !name || !mobile || !message) {
      return sendError(res, 'Missing required fields', 400);
    }

    const banquet = await Banquet.findById(banquetId);
    if (!banquet) {
      return sendError(res, 'Banquet not found', 404);
    }

    const enquiry = await BanquetEnquiry.create({
      banquetId,
      organizerId: banquet.organizer.organizerId,
      userId: req.user ? req.user._id : null,
      name,
      mobile,
      email,
      message,
    });

    return sendSuccess(res, 'Enquiry submitted successfully', { enquiry }, 201);
  } catch (error) {
    console.error('Error creating banquet enquiry:', error);
    return sendError(res, 'Failed to submit enquiry', 500);
  }
};

/**
 * Organizer: Get all enquiries for their banquets
 */
const getOrganizerEnquiries = async (req, res) => {
  try {
    const enquiries = await BanquetEnquiry.find({ organizerId: req.user._id })
      .populate('banquetId', 'title')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Enquiries fetched successfully', { enquiries });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return sendError(res, 'Failed to fetch enquiries', 500);
  }
};

/**
 * Organizer: Update enquiry status
 */
const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const enquiry = await BanquetEnquiry.findOne({ _id: id, organizerId: req.user._id });

    if (!enquiry) {
      return sendError(res, 'Enquiry not found', 404);
    }

    enquiry.status = status;
    await enquiry.save();

    return sendSuccess(res, 'Enquiry status updated successfully', { enquiry });
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    return sendError(res, 'Failed to update enquiry status', 500);
  }
};

/**
 * Customer: Get their own enquiries
 */
const getUserEnquiries = async (req, res) => {
  try {
    const enquiries = await BanquetEnquiry.find({ userId: req.user._id })
      .populate('banquetId', 'title banners address')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Your enquiries fetched successfully', { enquiries });
  } catch (error) {
    console.error('Error fetching user enquiries:', error);
    return sendError(res, 'Failed to fetch your enquiries', 500);
  }
};

module.exports = {
  createEnquiry,
  getOrganizerEnquiries,
  updateEnquiryStatus,
  getUserEnquiries,
};
