const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const {
  getAllCategories,
} = require('../../controllers/category.controller');

// Public category routes - no authentication required

// Get all active categories
router.get('/', asyncHandler(getAllCategories));

module.exports = router;

