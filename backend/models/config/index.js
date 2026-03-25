// Centralized configuration export
const env = require('./env');
const logger = require('./logger');
const corsOptions = require('./cors');
const connectDB = require('./database');

module.exports = {
  env,
  logger,
  corsOptions,
  connectDB,
};

