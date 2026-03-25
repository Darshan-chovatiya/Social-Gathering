const FarmhouseEnquiry = require('../models/FarmhouseEnquiry');
const Farmhouse = require('../models/Farmhouse');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Customer: Submit an enquiry for a farmhouse
 */
const createEnquiry = async (req, res) => {
  try {
    const { farmhouseId, name, mobile, email, message } = req.body;

    if (!farmhouseId || !name || !mobile || !message) {
      return sendError(res, 'Missing required fields', 400);
    }

    const farmhouse = await Farmhouse.findById(farmhouseId);
    if (!farmhouse) {
      return sendError(res, 'Farmhouse not found', 404);
    }

    const enquiry = await FarmhouseEnquiry.create({
      farmhouseId,
      organizerId: farmhouse.organizer.organizerId,
      name,
      mobile,
      email,
      message,
    });

    return sendSuccess(res, 'Enquiry submitted successfully', { enquiry }, 201);
  } catch (error) {
    console.error('Error creating farmhouse enquiry:', error);
    return sendError(res, 'Failed to submit enquiry', 500);
  }
};

/**
 * Organizer: Get all enquiries for their farmhouses
 */
const getOrganizerEnquiries = async (req, res) => {
  try {
    const enquiries = await FarmhouseEnquiry.find({ organizerId: req.user._id })
      .populate('farmhouseId', 'title')
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

    const enquiry = await FarmhouseEnquiry.findOne({ _id: id, organizerId: req.user._id });

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

module.exports = {
  createEnquiry,
  getOrganizerEnquiries,
  updateEnquiryStatus,
};
