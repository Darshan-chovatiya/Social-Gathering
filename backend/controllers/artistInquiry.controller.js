const ArtistInquiry = require('../models/ArtistInquiry');
const { sendSuccess } = require('../utils/response');

/**
 * Public: submit artist inquiry (customer panel)
 */
const createArtistInquiry = async (req, res) => {
  const { fullName, email, countryCode, phone, organizationName, city } = req.body;

  const inquiry = await ArtistInquiry.create({
    fullName,
    email,
    countryCode: countryCode || '+91',
    phone: phone || '',
    organizationName,
    city: city || '',
  });

  return sendSuccess(
    res,
    'Thank you! Your artist inquiry has been submitted successfully.',
    {
      inquiry: {
        id: inquiry._id,
        fullName: inquiry.fullName,
        email: inquiry.email,
        createdAt: inquiry.createdAt,
      },
    },
    201
  );
};

module.exports = {
  createArtistInquiry,
};
