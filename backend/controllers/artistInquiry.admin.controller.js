const ArtistInquiry = require('../models/ArtistInquiry');
const { sendSuccess, sendError } = require('../utils/response');

const getAllArtistInquiriesAdmin = async (req, res) => {
  try {
    const { search = '', status } = req.query;
    const query = {};

    if (status && ['new', 'read', 'archived'].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { fullName: new RegExp(term, 'i') },
        { email: new RegExp(term, 'i') },
        { phone: new RegExp(term, 'i') },
        { organizationName: new RegExp(term, 'i') },
        { city: new RegExp(term, 'i') },
      ];
    }

    const inquiries = await ArtistInquiry.find(query).sort({ createdAt: -1 });

    return sendSuccess(res, 'Artist inquiries fetched successfully', {
      inquiries,
    });
  } catch (error) {
    console.error('Error fetching artist inquiries:', error);
    return sendError(res, 'Failed to fetch artist inquiries', 500);
  }
};

const getArtistInquiryByIdAdmin = async (req, res) => {
  try {
    const inquiry = await ArtistInquiry.findById(req.params.id);

    if (!inquiry) {
      return sendError(res, 'Artist inquiry not found', 404);
    }

    return sendSuccess(res, 'Artist inquiry fetched successfully', { inquiry });
  } catch (error) {
    console.error('Error fetching artist inquiry:', error);
    return sendError(res, 'Failed to fetch artist inquiry', 500);
  }
};

const createArtistInquiryAdmin = async (req, res) => {
  try {
    const { fullName, email, countryCode, phone, organizationName, city, status } = req.body;

    const inquiry = await ArtistInquiry.create({
      fullName,
      email,
      countryCode: countryCode || '+91',
      phone,
      organizationName,
      city: city || '',
      status: status || 'new',
    });

    return sendSuccess(res, 'Artist inquiry created successfully', { inquiry }, 201);
  } catch (error) {
    console.error('Error creating artist inquiry:', error);
    return sendError(res, 'Failed to create artist inquiry', 500);
  }
};

const updateArtistInquiryAdmin = async (req, res) => {
  try {
    const inquiry = await ArtistInquiry.findById(req.params.id);

    if (!inquiry) {
      return sendError(res, 'Artist inquiry not found', 404);
    }

    const { fullName, email, countryCode, phone, organizationName, city, status } = req.body;

    if (fullName !== undefined) inquiry.fullName = fullName;
    if (email !== undefined) inquiry.email = email;
    if (countryCode !== undefined) inquiry.countryCode = countryCode;
    if (phone !== undefined) inquiry.phone = phone;
    if (organizationName !== undefined) inquiry.organizationName = organizationName;
    if (city !== undefined) inquiry.city = city;
    if (status !== undefined) inquiry.status = status;

    await inquiry.save();

    return sendSuccess(res, 'Artist inquiry updated successfully', { inquiry });
  } catch (error) {
    console.error('Error updating artist inquiry:', error);
    return sendError(res, 'Failed to update artist inquiry', 500);
  }
};

const deleteArtistInquiryAdmin = async (req, res) => {
  try {
    const inquiry = await ArtistInquiry.findById(req.params.id);

    if (!inquiry) {
      return sendError(res, 'Artist inquiry not found', 404);
    }

    await ArtistInquiry.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 'Artist inquiry deleted successfully');
  } catch (error) {
    console.error('Error deleting artist inquiry:', error);
    return sendError(res, 'Failed to delete artist inquiry', 500);
  }
};

module.exports = {
  getAllArtistInquiriesAdmin,
  getArtistInquiryByIdAdmin,
  createArtistInquiryAdmin,
  updateArtistInquiryAdmin,
  deleteArtistInquiryAdmin,
};
