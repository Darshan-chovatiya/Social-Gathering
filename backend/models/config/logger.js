const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    } else {
      console.log(`[INFO] ${message}`);
    }
  },
  
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },
  
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
};

module.exports = logger;

