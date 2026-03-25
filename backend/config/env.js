const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Determine which .env file to load based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' 
  ? '.env.production' 
  : '.env.local';

const envPath = path.resolve(__dirname, '..', envFile);

// Load environment variables from specific env file if it exists
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // If no .env file exists, use process.env (useful for production deployments)
  if (nodeEnv === 'production') {
    console.warn(`Warning: .env.production file not found. Using system environment variables.`);
  } else {
    console.warn(`Warning: .env.local file not found. Using system environment variables.`);
  }
}

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PORT',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Set default NODE_ENV if not specified
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  
  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  
  // Frontend URLs
  ADMIN_PANEL_URL: process.env.ADMIN_PANEL_URL,
  ORGANIZER_PANEL_URL: process.env.ORGANIZER_PANEL_URL,
  MOBILE_APP_URL: process.env.MOBILE_APP_URL,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'sandbox',
  
  // Cashfree
  // Optional explicit return URL override (must be HTTPS for production Cashfree)
  CASHFREE_RETURN_URL: process.env.CASHFREE_RETURN_URL,

  // OTP Bypass
  BYPASS_OTP: process.env.BYPASS_OTP || '123456',
  BYPASS_NUMBERS: process.env.BYPASS_NUMBERS ? process.env.BYPASS_NUMBERS.split(',') : [],
};

