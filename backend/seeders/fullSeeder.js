const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Load environment variables
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' ? '.env.production' : '.env.local';
const envPath = path.resolve(__dirname, '..', envFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');
const Offer = require('../models/Offer');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// Authentic sample data
const sampleUsers = [
  { name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com', mobile: '9876543210', role: 'user' },
  { name: 'Priya Sharma', email: 'priya.sharma@email.com', mobile: '9876543211', role: 'user' },
  { name: 'Amit Patel', email: 'amit.patel@email.com', mobile: '9876543212', role: 'user' },
  { name: 'Sneha Reddy', email: 'sneha.reddy@email.com', mobile: '9876543213', role: 'user' },
  { name: 'Vikram Singh', email: 'vikram.singh@email.com', mobile: '9876543214', role: 'user' },
  { name: 'Anjali Mehta', email: 'anjali.mehta@email.com', mobile: '9876543215', role: 'user' },
  { name: 'Rahul Desai', email: 'rahul.desai@email.com', mobile: '9876543216', role: 'user' },
  { name: 'Kavita Joshi', email: 'kavita.joshi@email.com', mobile: '9876543217', role: 'user' },
];

const sampleOrganizers = [
  { name: 'Event Masters India', email: 'contact@eventmasters.in', mobile: '9123456789', role: 'organizer' },
  { name: 'Concert Hub', email: 'info@concerthub.com', mobile: '9123456790', role: 'organizer' },
  { name: 'Sports Events Co.', email: 'hello@sportsevents.co', mobile: '9123456791', role: 'organizer' },
  { name: 'Cultural Festivals', email: 'team@culturalfestivals.in', mobile: '9123456792', role: 'organizer' },
  { name: 'Tech Conferences', email: 'contact@techconferences.com', mobile: '9123456793', role: 'organizer' },
];

const sampleCategories = [
  { name: 'Music & Concerts', description: 'Live music concerts, DJ nights, and musical performances' },
  { name: 'Sports & Fitness', description: 'Sports events, marathons, fitness workshops, and competitions' },
  { name: 'Comedy & Entertainment', description: 'Stand-up comedy shows, open mics, and entertainment events' },
  { name: 'Workshops & Learning', description: 'Educational workshops, seminars, and skill development sessions' },
  { name: 'Food & Drinks', description: 'Food festivals, wine tastings, and culinary events' },
  { name: 'Arts & Culture', description: 'Art exhibitions, cultural festivals, and heritage events' },
  { name: 'Business & Networking', description: 'Business conferences, networking events, and startup meetups' },
  { name: 'Technology', description: 'Tech conferences, hackathons, and innovation events' },
];

const generateEvents = (organizers, categories, adminId) => {
  const events = [];
  const cities = [
    { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    { city: 'Delhi', state: 'Delhi', pincode: '110001' },
    { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
    { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
    { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
    { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
  ];

  const eventTemplates = [
    {
      title: 'Summer Music Festival 2024',
      description: 'Join us for an electrifying music festival featuring top artists from across the country. Experience live performances, food stalls, and an unforgettable atmosphere.',
      duration: 6,
      categories: [0, 7], // Music & Concerts, Technology
      slots: [
        { date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), startTime: '18:00', endTime: '23:00' },
        { date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), startTime: '18:00', endTime: '23:00' },
      ],
      ticketTypes: [
        { title: 'Early Bird', price: 999, totalQuantity: 500, availableQuantity: 350 },
        { title: 'Regular', price: 1499, totalQuantity: 1000, availableQuantity: 800 },
        { title: 'VIP', price: 2999, totalQuantity: 200, availableQuantity: 150 },
      ],
      isFeatured: true,
    },
    {
      title: 'Tech Startup Summit',
      description: 'A premier gathering of entrepreneurs, investors, and innovators. Network with industry leaders and discover the next big thing in technology.',
      duration: 8,
      categories: [4, 7], // Business & Networking, Technology
      slots: [
        { date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), startTime: '09:00', endTime: '18:00' },
      ],
      ticketTypes: [
        { title: 'Student Pass', price: 499, totalQuantity: 300, availableQuantity: 200 },
        { title: 'Professional', price: 1999, totalQuantity: 500, availableQuantity: 400 },
        { title: 'VIP Access', price: 4999, totalQuantity: 100, availableQuantity: 80 },
      ],
      isFeatured: true,
    },
    {
      title: 'Comedy Night Special',
      description: 'Laugh your heart out with India\'s top comedians. An evening filled with humor, wit, and entertainment that you won\'t forget.',
      duration: 3,
      categories: [2], // Comedy & Entertainment
      slots: [
        { date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), startTime: '19:00', endTime: '22:00' },
        { date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), startTime: '19:00', endTime: '22:00' },
      ],
      ticketTypes: [
        { title: 'Standard', price: 399, totalQuantity: 400, availableQuantity: 300 },
        { title: 'Premium', price: 699, totalQuantity: 200, availableQuantity: 150 },
      ],
    },
    {
      title: 'Marathon Run 2024',
      description: 'Join thousands of runners in this annual marathon. Choose from 5K, 10K, or 21K categories. All participants receive a medal and t-shirt.',
      duration: 4,
      categories: [1], // Sports & Fitness
      slots: [
        { date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), startTime: '06:00', endTime: '10:00' },
      ],
      ticketTypes: [
        { title: '5K Run', price: 599, totalQuantity: 1000, availableQuantity: 800 },
        { title: '10K Run', price: 799, totalQuantity: 800, availableQuantity: 600 },
        { title: 'Half Marathon', price: 1299, totalQuantity: 500, availableQuantity: 400 },
      ],
    },
    {
      title: 'Food & Wine Festival',
      description: 'Indulge in a culinary journey with dishes from around the world. Sample wines, craft beers, and gourmet food from renowned chefs.',
      duration: 5,
      categories: [4], // Food & Drinks
      slots: [
        { date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), startTime: '16:00', endTime: '21:00' },
        { date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000), startTime: '16:00', endTime: '21:00' },
        { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), startTime: '16:00', endTime: '21:00' },
      ],
      ticketTypes: [
        { title: 'Day Pass', price: 1299, totalQuantity: 600, availableQuantity: 450 },
        { title: 'Weekend Pass', price: 2999, totalQuantity: 300, availableQuantity: 200 },
      ],
    },
    {
      title: 'Art Exhibition: Modern Masters',
      description: 'Explore contemporary art from emerging and established artists. Featuring paintings, sculptures, and digital art installations.',
      duration: 6,
      categories: [5], // Arts & Culture
      slots: [
        { date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), startTime: '11:00', endTime: '19:00' },
        { date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), startTime: '11:00', endTime: '19:00' },
        { date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), startTime: '11:00', endTime: '19:00' },
        { date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), startTime: '11:00', endTime: '19:00' },
        { date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), startTime: '11:00', endTime: '19:00' },
      ],
      ticketTypes: [
        { title: 'General Admission', price: 299, totalQuantity: 1000, availableQuantity: 750 },
        { title: 'Student Discount', price: 149, totalQuantity: 200, availableQuantity: 100 },
      ],
    },
    {
      title: 'Yoga & Meditation Workshop',
      description: 'Learn ancient yoga techniques and meditation practices from certified instructors. Suitable for all levels, from beginners to advanced practitioners.',
      duration: 3,
      categories: [1, 3], // Sports & Fitness, Workshops & Learning
      slots: [
        { date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), startTime: '08:00', endTime: '11:00' },
        { date: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000), startTime: '08:00', endTime: '11:00' },
      ],
      ticketTypes: [
        { title: 'Single Session', price: 799, totalQuantity: 100, availableQuantity: 70 },
        { title: 'Both Sessions', price: 1299, totalQuantity: 100, availableQuantity: 80 },
      ],
    },
    {
      title: 'Jazz Night Live',
      description: 'Experience smooth jazz performances by renowned musicians. An intimate evening of soulful music, fine dining, and great ambiance.',
      duration: 4,
      categories: [0], // Music & Concerts
      slots: [
        { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), startTime: '20:00', endTime: '00:00' },
      ],
      ticketTypes: [
        { title: 'Standard', price: 899, totalQuantity: 150, availableQuantity: 100 },
        { title: 'VIP with Dinner', price: 2499, totalQuantity: 50, availableQuantity: 30 },
      ],
    },
  ];

  eventTemplates.forEach((template, index) => {
    const organizer = organizers[index % organizers.length];
    const location = cities[index % cities.length];
    
    events.push({
      ...template,
      organizerId: organizer._id,
      organizerName: organizer.name,
      organizerContact: organizer.email || organizer.mobile,
      categoryIds: template.categories.map(catIdx => categories[catIdx]._id),
      address: {
        fullAddress: `${Math.floor(Math.random() * 999) + 1} Main Street, ${location.city}`,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
      },
      termsAndConditions: 'Tickets are non-refundable. Please arrive 30 minutes before the event. Age restrictions may apply. For any queries, contact the organizer.',
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
    });
  });

  return events;
};

const generateOffers = (adminId, events, categories) => {
  const musicCategory = categories.find(c => c.name === 'Music & Concerts');
  
  const offers = [
    {
      title: 'Early Bird Special',
      description: 'Get 20% off on all events. Limited time offer!',
      type: 'percentage',
      value: 20,
      maxDiscount: 500,
      minPurchaseAmount: 1000,
      createdBy: adminId,
      createdByRole: 'admin',
      categoryId: null,
      eventId: null,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      code: 'EARLY20',
      isActive: true,
    },
    {
      title: 'Weekend Special',
      description: 'Flat ₹200 off on weekend events',
      type: 'flat',
      value: 200,
      minPurchaseAmount: 500,
      createdBy: adminId,
      createdByRole: 'admin',
      categoryId: null,
      eventId: null,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      code: 'WEEKEND200',
      isActive: true,
    },
  ];

  // Add music category offer if category exists
  if (musicCategory) {
    offers.push({
      title: 'Music Lovers',
      description: '15% off on all music events',
      type: 'percentage',
      value: 15,
      maxDiscount: 300,
      minPurchaseAmount: 500,
      createdBy: adminId,
      createdByRole: 'admin',
      categoryId: musicCategory._id,
      eventId: null,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      code: 'MUSIC15',
      isActive: true,
    });
  }

  return offers;
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prime_tickets');

    // Clear existing data (optional - comment out if you want to keep existing data)
    const clearData = process.argv.includes('--clear');
    if (clearData) {
      await User.deleteMany({ role: { $ne: 'admin' } });
      await Category.deleteMany();
      await Event.deleteMany();
      await Offer.deleteMany();
      await Booking.deleteMany();
      await Payment.deleteMany();
    }

    const adminData = {
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@primetickets.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      mobile: process.env.ADMIN_MOBILE || '9999999999',
      role: 'admin',
      isActive: true,
      isMobileVerified: true,
    };

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      adminData.password = await bcrypt.hash(adminData.password, salt);
      admin = await User.create(adminData);
   
    }

    // Create Users - Optimized with bulk operations
    console.log('\n👥 Creating users...');
    const userEmails = sampleUsers.map(u => u.email).filter(Boolean);
    const userMobiles = sampleUsers.map(u => u.mobile);
    const existingUsers = await User.find({
      $or: [
        { email: { $in: userEmails } },
        { mobile: { $in: userMobiles } }
      ]
    });
    
    const existingUserMap = new Map();
    existingUsers.forEach(u => {
      if (u.email) existingUserMap.set(u.email, u);
      if (u.mobile) existingUserMap.set(u.mobile, u);
    });
    
    const usersToCreate = [];
    const passwordPromises = [];
    
    for (const userData of sampleUsers) {
      const existingUser = existingUserMap.get(userData.email) || existingUserMap.get(userData.mobile);
      
      if (!existingUser) {
        passwordPromises.push(bcrypt.hash('User@123', 10));
        usersToCreate.push({
          ...userData,
          isActive: true,
          isMobileVerified: true,
        });
      }
    }
    
    const hashedPasswords = await Promise.all(passwordPromises);
    usersToCreate.forEach((user, index) => {
      user.password = hashedPasswords[index];
    });
    
    let newUsers = [];
    if (usersToCreate.length > 0) {
      try {
        newUsers = await User.insertMany(usersToCreate, { ordered: false });
        newUsers.forEach(user => {
          console.log(`  ✅ User created: ${user.name} (${user.email || user.mobile})`);
        });
      } catch (error) {
        // Handle duplicate key errors (ordered: false allows partial success)
        if (error.writeErrors) {
          const insertedIds = error.insertedIds || {};
          newUsers = await User.find({ _id: { $in: Object.values(insertedIds) } });
          newUsers.forEach(user => {
            console.log(`  ✅ User created: ${user.name} (${user.email || user.mobile})`);
          });
        }
      }
    }
    
    // Combine existing and new users
    const createdUsers = [...existingUsers];
    newUsers.forEach(newUser => {
      if (!createdUsers.find(u => u._id.toString() === newUser._id.toString())) {
        createdUsers.push(newUser);
      }
    });
    
    // Fill in missing users from sample data
    sampleUsers.forEach(userData => {
      const found = createdUsers.find(u => 
        (userData.email && u.email === userData.email) || 
        (userData.mobile && u.mobile === userData.mobile)
      );
      if (!found) {
        const existing = existingUserMap.get(userData.email) || existingUserMap.get(userData.mobile);
        if (existing) {
          console.log(`  ℹ️  User already exists: ${userData.name}`);
        }
      }
    });

    // Create Organizers - Optimized with bulk operations
    console.log('\n🎯 Creating organizers...');
    const orgEmails = sampleOrganizers.map(o => o.email).filter(Boolean);
    const orgMobiles = sampleOrganizers.map(o => o.mobile);
    const existingOrgs = await User.find({
      $or: [
        { email: { $in: orgEmails } },
        { mobile: { $in: orgMobiles } }
      ]
    });
    
    const existingOrgMap = new Map();
    existingOrgs.forEach(o => {
      if (o.email) existingOrgMap.set(o.email, o);
      if (o.mobile) existingOrgMap.set(o.mobile, o);
    });
    
    const orgsToCreate = [];
    const orgsToUpdate = [];
    const orgPasswordPromises = [];
    
    for (const orgData of sampleOrganizers) {
      const existingOrg = existingOrgMap.get(orgData.email) || existingOrgMap.get(orgData.mobile);
      
      if (!existingOrg) {
        orgPasswordPromises.push(bcrypt.hash('Organizer@123', 10));
        orgsToCreate.push({
          ...orgData,
          isActive: true,
          isMobileVerified: true,
        });
      } else if (existingOrg.role !== 'organizer') {
        orgsToUpdate.push({ _id: existingOrg._id, role: 'organizer' });
      }
    }
    
    const orgHashedPasswords = await Promise.all(orgPasswordPromises);
    orgsToCreate.forEach((org, index) => {
      org.password = orgHashedPasswords[index];
    });
    
    let newOrganizers = [];
    if (orgsToCreate.length > 0) {
      try {
        newOrganizers = await User.insertMany(orgsToCreate, { ordered: false });
        newOrganizers.forEach(org => {
          console.log(`  ✅ Organizer created: ${org.name} (${org.email || org.mobile})`);
        });
      } catch (error) {
        if (error.writeErrors) {
          const insertedIds = error.insertedIds || {};
          newOrganizers = await User.find({ _id: { $in: Object.values(insertedIds) } });
          newOrganizers.forEach(org => {
            console.log(`  ✅ Organizer created: ${org.name} (${org.email || org.mobile})`);
          });
        }
      }
    }
    
    // Update existing users to organizers
    if (orgsToUpdate.length > 0) {
      const updateIds = orgsToUpdate.map(o => o._id);
      await User.updateMany(
        { _id: { $in: updateIds } },
        { $set: { role: 'organizer' } }
      );
      orgsToUpdate.forEach(update => {
        console.log(`  ✅ Updated to organizer`);
      });
    }
    
    // Combine existing and new organizers
    const createdOrganizers = [...existingOrgs.filter(o => o.role === 'organizer')];
    newOrganizers.forEach(newOrg => {
      if (!createdOrganizers.find(o => o._id.toString() === newOrg._id.toString())) {
        createdOrganizers.push(newOrg);
      }
    });
    
    // Update existing orgs that were changed
    const updatedOrgs = await User.find({ _id: { $in: orgsToUpdate.map(o => o._id) } });
    updatedOrgs.forEach(org => {
      if (!createdOrganizers.find(o => o._id.toString() === org._id.toString())) {
        createdOrganizers.push(org);
      }
    });
    
    // Fill in missing organizers from sample data
    sampleOrganizers.forEach(orgData => {
      const found = createdOrganizers.find(o => 
        (orgData.email && o.email === orgData.email) || 
        (orgData.mobile && o.mobile === orgData.mobile)
      );
      if (!found) {
        const existing = existingOrgMap.get(orgData.email) || existingOrgMap.get(orgData.mobile);
        if (existing && existing.role === 'organizer') {
          console.log(`  ℹ️  Organizer already exists: ${orgData.name}`);
        }
      }
    });

    // Create Categories - Optimized with bulk operations
    console.log('\n📂 Creating categories...');
    const categoryNames = sampleCategories.map(c => c.name);
    const existingCategories = await Category.find({ name: { $in: categoryNames } });
    
    const existingCategoryMap = new Map();
    existingCategories.forEach(c => existingCategoryMap.set(c.name, c));
    
    const categoriesToCreate = sampleCategories
      .filter(catData => !existingCategoryMap.has(catData.name))
      .map(catData => ({
        ...catData,
        createdBy: admin._id,
        isActive: true,
      }));
    
    let newCategories = [];
    if (categoriesToCreate.length > 0) {
      try {
        newCategories = await Category.insertMany(categoriesToCreate, { ordered: false });
        newCategories.forEach(category => {
          console.log(`  ✅ Category created: ${category.name}`);
        });
      } catch (error) {
        if (error.writeErrors) {
          const insertedIds = error.insertedIds || {};
          newCategories = await Category.find({ _id: { $in: Object.values(insertedIds) } });
          newCategories.forEach(category => {
            console.log(`  ✅ Category created: ${category.name}`);
          });
        }
      }
    }
    
    existingCategories.forEach(cat => {
      console.log(`  ℹ️  Category already exists: ${cat.name}`);
    });
    
    // Combine existing and new categories
    const createdCategories = [...existingCategories, ...newCategories];

    // Create Events - Optimized with bulk operations
    console.log('\n🎪 Creating events...');
    const eventData = generateEvents(createdOrganizers, createdCategories, admin._id);
    const eventTitles = eventData.map(e => e.title);
    const existingEvents = await Event.find({ title: { $in: eventTitles } });
    
    const existingEventMap = new Map();
    existingEvents.forEach(e => existingEventMap.set(e.title, e));
    
    const eventsToCreate = eventData
      .filter(evtData => !existingEventMap.has(evtData.title))
      .map(evtData => ({
        title: evtData.title,
        description: evtData.description,
        categories: evtData.categoryIds,
        organizer: {
          organizerId: evtData.organizerId,
          name: evtData.organizerName,
          contactInfo: evtData.organizerContact,
        },
        slots: evtData.slots,
        ticketTypes: evtData.ticketTypes,
        duration: evtData.duration,
        address: evtData.address,
        termsAndConditions: evtData.termsAndConditions,
        status: evtData.status,
        approvedBy: evtData.approvedBy,
        approvedAt: evtData.approvedAt,
        isFeatured: evtData.isFeatured || false,
        isActive: true,
      }));
    
    let newEvents = [];
    if (eventsToCreate.length > 0) {
      try {
        newEvents = await Event.insertMany(eventsToCreate, { ordered: false });
        newEvents.forEach(event => {
          console.log(`  ✅ Event created: ${event.title}`);
        });
      } catch (error) {
        if (error.writeErrors) {
          const insertedIds = error.insertedIds || {};
          newEvents = await Event.find({ _id: { $in: Object.values(insertedIds) } });
          newEvents.forEach(event => {
            console.log(`  ✅ Event created: ${event.title}`);
          });
        }
      }
    }
    
    existingEvents.forEach(event => {
      console.log(`  ℹ️  Event already exists: ${event.title}`);
    });
    
    // Combine existing and new events
    const createdEvents = [...existingEvents, ...newEvents];

    // Create Offers - Optimized with bulk operations
    console.log('\n🎁 Creating offers...');
    const offerData = generateOffers(admin._id, createdEvents, createdCategories);
    const offerCodes = offerData.map(o => o.code).filter(Boolean);
    const existingOffers = await Offer.find({ code: { $in: offerCodes } });
    
    const existingOfferMap = new Map();
    existingOffers.forEach(o => existingOfferMap.set(o.code, o));
    
    const offersToCreate = offerData.filter(offData => !existingOfferMap.has(offData.code));
    
    let newOffers = [];
    if (offersToCreate.length > 0) {
      try {
        newOffers = await Offer.insertMany(offersToCreate, { ordered: false });
        newOffers.forEach(offer => {
          console.log(`  ✅ Offer created: ${offer.title} (${offer.code})`);
        });
      } catch (error) {
        if (error.writeErrors) {
          const insertedIds = error.insertedIds || {};
          newOffers = await Offer.find({ _id: { $in: Object.values(insertedIds) } });
          newOffers.forEach(offer => {
            console.log(`  ✅ Offer created: ${offer.title} (${offer.code})`);
          });
        }
      }
    }
    
    existingOffers.forEach(offer => {
      console.log(`  ℹ️  Offer already exists: ${offer.code}`);
    });
    
    // Combine existing and new offers
    const createdOffers = [...existingOffers, ...newOffers];

    // Create Sample Bookings (optional - for demo purposes) - Optimized
    console.log('\n🎫 Creating sample bookings...');
    let bookingCount = 0;
    let paymentCount = 0;
    
    // Fetch events in bulk
    const eventIds = createdEvents.slice(0, Math.min(5, createdEvents.length)).map(e => e._id);
    const events = await Event.find({ _id: { $in: eventIds } });
    
    const bookingsToCreate = [];
    const paymentDataMap = new Map(); // Map bookingId to payment data
    const userNameMap = new Map(); // Map bookingId to user name for logging
    const baseTime = Date.now();
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event || !event.slots || event.slots.length === 0) continue;
      
      const slot = event.slots[0];
      const ticketType = event.ticketTypes[0];
      const user = createdUsers[i % createdUsers.length];
      
      if (ticketType && ticketType.availableQuantity > 0) {
        const quantity = Math.min(2, ticketType.availableQuantity);
        const subtotal = ticketType.price * quantity;
        const discount = Math.floor(subtotal * 0.1); // 10% discount
        const totalAmount = subtotal - discount;
        
        const bookingId = `BK${baseTime + i}${Math.floor(Math.random() * 1000)}`;
        const timestamp = baseTime + i;
        
        bookingsToCreate.push({
          bookingId,
          userId: user._id,
          eventId: event._id,
          slotId: slot._id,
          slotDate: slot.date,
          slotStartTime: slot.startTime,
          slotEndTime: slot.endTime,
          tickets: [{
            ticketTypeId: ticketType._id,
            ticketTypeTitle: ticketType.title,
            quantity,
            price: ticketType.price,
            totalAmount: subtotal,
          }],
          subtotal,
          discount,
          totalAmount,
          paymentStatus: 'success',
          status: 'confirmed',
        });
        
        // Store payment data and user name by bookingId
        paymentDataMap.set(bookingId, {
          userId: user._id,
          amount: totalAmount,
          currency: 'INR',
          paymentMethod: ['upi', 'card', 'netbanking'][Math.floor(Math.random() * 3)],
          status: 'success',
          razorpayOrderId: `order_${timestamp}${Math.floor(Math.random() * 1000)}`,
          razorpayPaymentId: `pay_${timestamp}${Math.floor(Math.random() * 1000)}`,
        });
        userNameMap.set(bookingId, user.name);
      }
    }
    
    // Create bookings in bulk
    if (bookingsToCreate.length > 0) {
      try {
        const newBookings = await Booking.insertMany(bookingsToCreate, { ordered: false });
        
        // Create payments with booking references
        const paymentsWithBookingIds = newBookings.map(booking => {
          const paymentData = paymentDataMap.get(booking.bookingId);
          return {
            ...paymentData,
            bookingId: booking._id,
          };
        });
        
        const newPayments = await Payment.insertMany(paymentsWithBookingIds, { ordered: false });
        
        // Update bookings with payment IDs using bulkWrite
        const updateOps = newPayments.map((payment, idx) => {
          const booking = newBookings[idx];
          return {
            updateOne: {
              filter: { _id: booking._id },
              update: { $set: { paymentId: payment._id } }
            }
          };
        });
        
        if (updateOps.length > 0) {
          await Booking.bulkWrite(updateOps);
        }
        
        // Log results
        newBookings.forEach(booking => {
          const userName = userNameMap.get(booking.bookingId) || 'Unknown';
          bookingCount++;
          console.log(`  ✅ Booking created: ${booking.bookingId} for ${userName} (Payment: ₹${booking.totalAmount})`);
        });
        
        paymentCount = newPayments.length;
      } catch (error) {
        // Fallback to individual creation if bulk fails
        console.log(`  ⚠️  Bulk booking creation failed, using individual creates: ${error.message}`);
        for (const bookingData of bookingsToCreate) {
          try {
            const booking = await Booking.create(bookingData);
            const paymentData = paymentDataMap.get(bookingData.bookingId);
            const payment = await Payment.create({
              ...paymentData,
              bookingId: booking._id,
            });
            
            booking.paymentId = payment._id;
            await booking.save();
            
            const userName = userNameMap.get(bookingData.bookingId) || 'Unknown';
            bookingCount++;
            paymentCount++;
            console.log(`  ✅ Booking created: ${booking.bookingId} for ${userName} (Payment: ₹${booking.totalAmount})`);
          } catch (err) {
            console.log(`  ⚠️  Skipped booking: ${err.message}`);
          }
        }
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

