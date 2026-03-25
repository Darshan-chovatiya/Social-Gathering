const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { createArtistInquiryValidation } = require('../../validators/artistInquiry.validator');
const { createArtistInquiry } = require('../../controllers/artistInquiry.controller');

router.post('/', createArtistInquiryValidation, validate, asyncHandler(createArtistInquiry));

module.exports = router;
