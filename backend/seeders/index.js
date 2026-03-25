const mongoose = require('mongoose');
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
const Category = require('../models/Category');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prime_tickets');

    const adminData = {
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@primetickets.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      mobile: process.env.ADMIN_MOBILE || '9999999999',
      role: 'admin',
      isActive: true,
      isMobileVerified: true,
    };

    let existingAdmin = await User.findOne({
      $or: [
        { email: adminData.email },
        { role: 'admin', email: { $exists: true, $ne: null } },
      ],
    });

    if (existingAdmin) {
      if (process.env.ADMIN_PASSWORD) {
        // Need to select password field to update it
        existingAdmin = await User.findById(existingAdmin._id).select('+password');
        const salt = await bcrypt.genSalt(10);
        existingAdmin.password = await bcrypt.hash(adminData.password, salt);
        await existingAdmin.save();
      }
    } else {
      // Hash password before creating
      const salt = await bcrypt.genSalt(10);
      adminData.password = await bcrypt.hash(adminData.password, salt);
      const admin = await User.create(adminData);
    }

    const categories = [
      { name: 'Party', description: 'Party events and celebrations' },
      { name: 'Live Concert', description: 'Live music concerts and performances' },
      { name: 'Music', description: 'Music events and festivals' },
      { name: 'Sports', description: 'Sports events and competitions' },
      { name: 'Comedy', description: 'Comedy shows and stand-up performances' },
      { name: 'Workshop', description: 'Educational workshops and seminars' },
      { name: 'Conference', description: 'Business conferences and meetups' },
      { name: 'Exhibition', description: 'Art exhibitions and showcases' },
    ];

    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      if (!existingCategory) {
        const category = await Category.create({
          ...categoryData,
          createdBy: (await User.findOne({ role: 'admin' }))._id,
        });
      } 
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Login Credentials:');
    console.log(`  Email: ${adminData.email}`);
    console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
seedDatabase();

