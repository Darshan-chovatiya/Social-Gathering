const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' ? '.env.production' : '.env.local';
const envPath = path.resolve(__dirname, '..', envFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prime_tickets');

    // Admin user data
    const adminData = {
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@primetickets.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      mobile: process.env.ADMIN_MOBILE || '9999999999',
      role: 'admin',
      isActive: true,
      isMobileVerified: true,
    };

    // Check if admin already exists
    let existingAdmin = await User.findOne({
      $or: [
        { email: adminData.email },
        { role: 'admin', email: { $exists: true, $ne: null } },
      ],
    });

    if (existingAdmin) {  
      // Update password if provided
      if (process.env.ADMIN_PASSWORD) {
        // Need to select password field to update it
        existingAdmin = await User.findById(existingAdmin._id).select('+password');
        existingAdmin.password = adminData.password; // Let the pre-save hook hash it
        await existingAdmin.save();

      }
      
      await mongoose.connection.close();
      return;
    }

    // Create admin user (password will be hashed by pre-save hook)
    const admin = await User.create(adminData);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Credentials:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log(`  Name: ${admin.name}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
createAdminUser();

