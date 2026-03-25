const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/response');

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('-createdBy')
      .sort({ name: 1 });

    return sendSuccess(res, 'Categories fetched successfully', {
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return sendError(res, 'Failed to fetch categories', 500);
  }
};

const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Categories fetched successfully', {
      categories,
    });
  } catch (error) {
    console.error('Error fetching all categories:', error);
    return sendError(res, 'Failed to fetch categories', 500);
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return sendError(res, 'Category already exists', 400);
    }

    // Handle image upload
    const image = req.file ? `/uploads/categories/${req.file.filename}` : undefined;

    const category = await Category.create({
      name,
      description: description || undefined,
      image,
      createdBy: req.user._id,
    });

    return sendSuccess(res, 'Category created successfully', { category }, 201);
  } catch (error) {
    console.error('Error creating category:', error);
    // Log the actual error for debugging
    console.error('Error details:', error.message, error.stack);
    return sendError(res, error.message || 'Failed to create category', 500);
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    // Handle image upload
    if (req.file) {
      category.image = `/uploads/categories/${req.file.filename}`;
    }

    await category.save();

    return sendSuccess(res, 'Category updated successfully', { category });
  } catch (error) {
    console.error('Error updating category:', error);
    console.error('Error details:', error.message, error.stack);
    return sendError(res, error.message || 'Failed to update category', 500);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    return sendSuccess(res, 'Category deleted successfully');
  } catch (error) {
    console.error('Error deleting category:', error);
    return sendError(res, 'Failed to delete category', 500);
  }
};

module.exports = {
  getAllCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};

