const Farmhouse = require('../models/Farmhouse');
const { sendSuccess, sendError } = require('../utils/response');
const { encrypt, decrypt } = require('../utils/encryption.util');

const createFarmhouse = async (req, res) => {
  try {
    const farmhouseData = req.body;
    
    // Parse JSON fields
    if (typeof farmhouseData.amenities === 'string') farmhouseData.amenities = JSON.parse(farmhouseData.amenities);
    if (typeof farmhouseData.pricing === 'string') farmhouseData.pricing = JSON.parse(farmhouseData.pricing);
    if (typeof farmhouseData.deposit === 'string') farmhouseData.deposit = JSON.parse(farmhouseData.deposit);
    if (typeof farmhouseData.address === 'string') farmhouseData.address = JSON.parse(farmhouseData.address);
    if (typeof farmhouseData.organizer === 'string') farmhouseData.organizer = JSON.parse(farmhouseData.organizer);
    if (typeof farmhouseData.festivalDates === 'string') farmhouseData.festivalDates = JSON.parse(farmhouseData.festivalDates);

    // Move festivalDates from pricing to top-level if it's there
    if (farmhouseData.pricing && farmhouseData.pricing.festivalDates) {
      if (!farmhouseData.festivalDates) {
        farmhouseData.festivalDates = farmhouseData.pricing.festivalDates;
      }
      delete farmhouseData.pricing.festivalDates;
    }

    // Handle file uploads
    const banners = req.files?.banners ? req.files.banners.map(file => `/uploads/farmhouses/${file.filename}`) : [];
    const farmhouseImages = req.files?.farmhouseImages ? req.files.farmhouseImages.map(file => `/uploads/farmhouses/${file.filename}`) : [];
    const farmhouseDetailImage = req.files?.farmhouseDetailImage && req.files.farmhouseDetailImage.length > 0 
      ? `/uploads/farmhouses/${req.files.farmhouseDetailImage[0].filename}` 
      : null;

    const farmhouse = await Farmhouse.create({
      ...farmhouseData,
      banners: banners.length > 0 ? banners : farmhouseData.banners || [],
      farmhouseImages: farmhouseImages.length > 0 ? farmhouseImages : farmhouseData.farmhouseImages || [],
      farmhouseDetailImage: farmhouseDetailImage || farmhouseData.farmhouseDetailImage || null,
      organizer: {
        ...farmhouseData.organizer,
        organizerId: req.user._id,
      },
      status: 'pending',
    });

    return sendSuccess(res, 'Farmhouse created successfully. Waiting for admin approval.', { farmhouse }, 201);
  } catch (error) {
    console.error('Error creating farmhouse:', error);
    return sendError(res, 'Failed to create farmhouse', 500);
  }
};

const updateFarmhouse = async (req, res) => {
  try {
    const farmhouse = await Farmhouse.findById(req.params.id);
    if (!farmhouse) return sendError(res, 'Farmhouse not found', 404);

    if (farmhouse.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'You can only update your own farmhouses', 403);
    }

    const farmhouseData = req.body;

    // Parse JSON fields
    if (typeof farmhouseData.amenities === 'string') farmhouseData.amenities = JSON.parse(farmhouseData.amenities);
    if (typeof farmhouseData.pricing === 'string') farmhouseData.pricing = JSON.parse(farmhouseData.pricing);
    if (typeof farmhouseData.deposit === 'string') farmhouseData.deposit = JSON.parse(farmhouseData.deposit);
    if (typeof farmhouseData.address === 'string') farmhouseData.address = JSON.parse(farmhouseData.address);
    if (typeof farmhouseData.organizer === 'string') farmhouseData.organizer = JSON.parse(farmhouseData.organizer);
    if (typeof farmhouseData.festivalDates === 'string') farmhouseData.festivalDates = JSON.parse(farmhouseData.festivalDates);

    // Ensure festivalDates is at a top level and not inside pricing
    if (farmhouseData.festivalDates) {
      farmhouse.festivalDates = farmhouseData.festivalDates;
    }
    if (farmhouseData.pricing && farmhouseData.pricing.festivalDates) {
      if (!farmhouse.festivalDates || farmhouse.festivalDates.length === 0) {
        farmhouse.festivalDates = farmhouseData.pricing.festivalDates;
      }
      delete farmhouseData.pricing.festivalDates;
    }

    // Handle banners
    if (req.files?.banners && req.files.banners.length > 0) {
      const newBanners = req.files.banners.map(file => `/uploads/farmhouses/${file.filename}`);
      farmhouseData.banners = [...(farmhouse.banners || []), ...newBanners];
    }
    if (farmhouseData.existingBanners) {
      const existing = typeof farmhouseData.existingBanners === 'string' ? JSON.parse(farmhouseData.existingBanners) : farmhouseData.existingBanners;
      farmhouseData.banners = existing;
      if (req.files?.banners && req.files.banners.length > 0) {
        const newBanners = req.files.banners.map(file => `/uploads/farmhouses/${file.filename}`);
        farmhouseData.banners = [...farmhouseData.banners, ...newBanners];
      }
    }

    // Handle farmhouseImages
    if (req.files?.farmhouseImages && req.files.farmhouseImages.length > 0) {
      const newImages = req.files.farmhouseImages.map(file => `/uploads/farmhouses/${file.filename}`);
      farmhouseData.farmhouseImages = [...(farmhouse.farmhouseImages || []), ...newImages];
    }
    if (farmhouseData.existingFarmhouseImages) {
      const existing = typeof farmhouseData.existingFarmhouseImages === 'string' ? JSON.parse(farmhouseData.existingFarmhouseImages) : farmhouseData.existingFarmhouseImages;
      farmhouseData.farmhouseImages = existing;
      if (req.files?.farmhouseImages && req.files.farmhouseImages.length > 0) {
        const newImages = req.files.farmhouseImages.map(file => `/uploads/farmhouses/${file.filename}`);
        farmhouseData.farmhouseImages = [...farmhouseData.farmhouseImages, ...newImages];
      }
    }

    // Handle detail image
    if (req.files?.farmhouseDetailImage && req.files.farmhouseDetailImage.length > 0) {
      farmhouseData.farmhouseDetailImage = `/uploads/farmhouses/${req.files.farmhouseDetailImage[0].filename}`;
    }

    // Explicitly handle festivalDates and remove it from pricing if it exists there
    if (farmhouseData.festivalDates) {
      farmhouse.festivalDates = farmhouseData.festivalDates;
    }
    
    // Clean up legacy pricing.festivalDates
    if (farmhouse.pricing && farmhouse.pricing.festivalDates) {
      if (!farmhouse.festivalDates || farmhouse.festivalDates.length === 0) {
        farmhouse.festivalDates = farmhouse.pricing.festivalDates;
      }
      // Re-assign pricing without festivalDates to ensure Mongoose detects the change
      const newPricing = { ...farmhouse.pricing.toObject ? farmhouse.pricing.toObject() : farmhouse.pricing };
      delete newPricing.festivalDates;
      farmhouse.pricing = newPricing;
    }

    if (farmhouseData.pricing && farmhouseData.pricing.festivalDates) {
      delete farmhouseData.pricing.festivalDates;
    }

    Object.assign(farmhouse, farmhouseData);
    await farmhouse.save();

    return sendSuccess(res, 'Farmhouse updated successfully', { farmhouse });
  } catch (error) {
    console.error('Error updating farmhouse:', error);
    return sendError(res, 'Failed to update farmhouse', 500);
  }
};

const getMyFarmhouses = async (req, res) => {
  try {
    const farmhouses = await Farmhouse.find({ 
      'organizer.organizerId': req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });
    return sendSuccess(res, 'My farmhouses fetched successfully', { farmhouses });
  } catch (error) {
    console.error('Error fetching my farmhouses:', error);
    return sendError(res, 'Failed to fetch my farmhouses', 500);
  }
};

const getAllFarmhouses = async (req, res) => {
  try {
    const { city, guests, search, page = 1, limit = 20 } = req.query;
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

const deleteFarmhouse = async (req, res) => {
  try {
    const farmhouse = await Farmhouse.findById(req.params.id);
    if (!farmhouse) return sendError(res, 'Farmhouse not found', 404);

    if (farmhouse.organizer.organizerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'You can only delete your own farmhouses', 403);
    }

    farmhouse.isActive = false;
    await farmhouse.save();

    return sendSuccess(res, 'Farmhouse deleted successfully');
  } catch (error) {
    console.error('Error deleting farmhouse:', error);
    return sendError(res, 'Failed to delete farmhouse', 500);
  }
};

module.exports = {
  createFarmhouse,
  updateFarmhouse,
  getMyFarmhouses,
  getAllFarmhouses,
  getFarmhouseById,
  deleteFarmhouse
};
