const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    if (process.env.NODE_ENV === 'development') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('MongoDB Connected successfully');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

