const Banquet = require('../../models/Banquet');
const { sendSuccess, sendError } = require('../../utils/response');

/**
 * Get all approved banquets for mobile app
 */
const getAllBanquets = async (req, res) => {
  try {
    const { city, search, page = 1, limit = 10 } = req.query;
    const query = { isActive: true, status: 'approved' };

    if (city) query['address.city'] = new RegExp(city, 'i');
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const banquets = await Banquet.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Banquet.countDocuments(query);

    return sendSuccess(res, 'Banquets fetched successfully', {
      banquets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching mobile banquets:', error);
    return sendError(res, 'Failed to fetch banquets', 500);
  }
};

/**
 * Get single banquet details for mobile app
 */
const getBanquetById = async (req, res) => {
  try {
    const banquet = await Banquet.findById(req.params.id)
      .populate('organizer.organizerId', 'name email mobile profilePicture');

    if (!banquet) return sendError(res, 'Banquet not found', 404);

    return sendSuccess(res, 'Banquet fetched successfully', { banquet });
  } catch (error) {
    console.error('Error fetching mobile banquet:', error);
    return sendError(res, 'Failed to fetch banquet', 500);
  }
};

module.exports = {
  getAllBanquets,
  getBanquetById,
};
