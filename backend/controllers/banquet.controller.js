const Banquet = require('../models/Banquet');
const { sendSuccess, sendError } = require('../utils/response');

const createBanquet = async (req, res) => {
  try {
    const banquetData = req.body;
    
    // Parse JSON fields
    if (typeof banquetData.amenities === 'string') banquetData.amenities = JSON.parse(banquetData.amenities);
    if (typeof banquetData.venues === 'string') banquetData.venues = JSON.parse(banquetData.venues);
    if (typeof banquetData.address === 'string') banquetData.address = JSON.parse(banquetData.address);
    if (typeof banquetData.organizer === 'string') banquetData.organizer = JSON.parse(banquetData.organizer);

    // Handle file uploads
    const banners = req.files?.banners ? req.files.banners.map(file => `/uploads/banquets/${file.filename}`) : [];
    const banquetImages = req.files?.banquetImages ? req.files.banquetImages.map(file => `/uploads/banquets/${file.filename}`) : [];

    const banquet = await Banquet.create({
      ...banquetData,
      banners: banners.length > 0 ? banners : banquetData.banners || [],
      banquetImages: banquetImages.length > 0 ? banquetImages : banquetData.banquetImages || [],
      organizer: {
        ...banquetData.organizer,
        organizerId: req.user._id,
      },
      status: 'pending',
    });

    return sendSuccess(res, 'Banquet created successfully. Waiting for admin approval.', { banquet }, 201);
  } catch (error) {
    console.error('Error creating banquet:', error);
    return sendError(res, 'Failed to create banquet', 500);
  }
};

const updateBanquet = async (req, res) => {
  try {
    const banquet = await Banquet.findById(req.params.id);
    if (!banquet) return sendError(res, 'Banquet not found', 404);

    if (banquet.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'You can only update your own banquets', 403);
    }

    const banquetData = req.body;

    // Parse JSON fields
    if (typeof banquetData.amenities === 'string') banquetData.amenities = JSON.parse(banquetData.amenities);
    if (typeof banquetData.venues === 'string') banquetData.venues = JSON.parse(banquetData.venues);
    if (typeof banquetData.address === 'string') banquetData.address = JSON.parse(banquetData.address);
    if (typeof banquetData.organizer === 'string') banquetData.organizer = JSON.parse(banquetData.organizer);

    // Handle banners
    if (req.files?.banners && req.files.banners.length > 0) {
      const newBanners = req.files.banners.map(file => `/uploads/banquets/${file.filename}`);
      banquetData.banners = [...(banquet.banners || []), ...newBanners];
    }
    if (banquetData.existingBanners) {
      const existing = typeof banquetData.existingBanners === 'string' ? JSON.parse(banquetData.existingBanners) : banquetData.existingBanners;
      banquetData.banners = existing;
      if (req.files?.banners && req.files.banners.length > 0) {
        const newBanners = req.files.banners.map(file => `/uploads/banquets/${file.filename}`);
        banquetData.banners = [...banquetData.banners, ...newBanners];
      }
    }
    
    // Handle banquetImages
    if (req.files?.banquetImages && req.files.banquetImages.length > 0) {
      const newImages = req.files.banquetImages.map(file => `/uploads/banquets/${file.filename}`);
      banquetData.banquetImages = [...(banquet.banquetImages || []), ...newImages];
    }
    if (banquetData.existingBanquetImages) {
      const existing = typeof banquetData.existingBanquetImages === 'string' ? JSON.parse(banquetData.existingBanquetImages) : banquetData.existingBanquetImages;
      banquetData.banquetImages = existing;
      if (req.files?.banquetImages && req.files.banquetImages.length > 0) {
        const newImages = req.files.banquetImages.map(file => `/uploads/banquets/${file.filename}`);
        banquetData.banquetImages = [...banquetData.banquetImages, ...newImages];
      }
    }

    Object.assign(banquet, banquetData);
    await banquet.save();

    return sendSuccess(res, 'Banquet updated successfully', { banquet });
  } catch (error) {
    console.error('Error updating banquet:', error);
    return sendError(res, 'Failed to update banquet', 500);
  }
};

const getMyBanquets = async (req, res) => {
  try {
    const banquets = await Banquet.find({ 
      'organizer.organizerId': req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });
    return sendSuccess(res, 'My banquets fetched successfully', { banquets });
  } catch (error) {
    console.error('Error fetching my banquets:', error);
    return sendError(res, 'Failed to fetch my banquets', 500);
  }
};

const getAllBanquets = async (req, res) => {
  try {
    const { city, search, page = 1, limit = 20 } = req.query;
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
    console.error('Error fetching banquets:', error);
    return sendError(res, 'Failed to fetch banquets', 500);
  }
};

const getBanquetById = async (req, res) => {
  try {
    const banquet = await Banquet.findById(req.params.id)
      .populate('organizer.organizerId', 'name email mobile profilePicture');

    if (!banquet) return sendError(res, 'Banquet not found', 404);

    return sendSuccess(res, 'Banquet fetched successfully', { banquet });
  } catch (error) {
    console.error('Error fetching banquet:', error);
    return sendError(res, 'Failed to fetch banquet', 500);
  }
};

const deleteBanquet = async (req, res) => {
  try {
    const banquet = await Banquet.findById(req.params.id);
    if (!banquet) return sendError(res, 'Banquet not found', 404);

    if (banquet.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'You can only delete your own banquets', 403);
    }

    banquet.isActive = false;
    await banquet.save();

    return sendSuccess(res, 'Banquet deleted successfully');
  } catch (error) {
    console.error('Error deleting banquet:', error);
    return sendError(res, 'Failed to delete banquet', 500);
  }
};

module.exports = {
  createBanquet,
  updateBanquet,
  getMyBanquets,
  getAllBanquets,
  getBanquetById,
  deleteBanquet
};
