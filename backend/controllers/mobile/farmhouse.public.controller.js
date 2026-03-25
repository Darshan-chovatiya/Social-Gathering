const Farmhouse = require('../../models/Farmhouse');
const { sendSuccess, sendError } = require('../../utils/response');

const getAllFarmhouses = async (req, res) => {
  try {
    const { city, guests, search, page = 1, limit = 10 } = req.query;
    const query = { isActive: true, status: 'approved' };

    if (city) query['address.city'] = new RegExp(city, 'i');
    if (guests) query['amenities.guests'] = { $gte: parseInt(guests) };
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const farmhouses = await Farmhouse.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Farmhouse.countDocuments(query);

    return sendSuccess(res, 'Farmhouses fetched successfully', {
      farmhouses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching farmhouses:', error);
    return sendError(res, 'Failed to fetch farmhouses', 500);
  }
};

const getFarmhouseById = async (req, res) => {
  try {
    const farmhouse = await Farmhouse.findById(req.params.id)
      .populate('organizer.organizerId', 'name email mobile profilePicture');

    if (!farmhouse) return sendError(res, 'Farmhouse not found', 404);

    return sendSuccess(res, 'Farmhouse fetched successfully', { farmhouse });
  } catch (error) {
    console.error('Error fetching farmhouse:', error);
    return sendError(res, 'Failed to fetch farmhouse', 500);
  }
};

module.exports = {
  getAllFarmhouses,
  getFarmhouseById
};
