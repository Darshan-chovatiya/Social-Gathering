/**
 * Standard response utility
 * All API responses should use this format: { status, message, result }
 */

const sendResponse = (res, statusCode, message, result = null) => {
  return res.status(statusCode).json({
    status: statusCode,
    message,
    result,
  });
};

const sendSuccess = (res, message, result = null, statusCode = 200) => {
  return sendResponse(res, statusCode, message, result);
};

const sendError = (res, message, statusCode = 400, result = null) => {
  return sendResponse(res, statusCode, message, result);
};

module.exports = {
  sendResponse,
  sendSuccess,
  sendError,
};

