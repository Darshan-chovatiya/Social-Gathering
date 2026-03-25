# Database Seeders

This directory contains database seeders to populate the application with sample data for development and testing purposes.

## Available Seeders

### 1. `adminSeeder.js` - Admin User Only
Creates a single admin user for accessing the admin panel.

**Usage:**
```bash
npm run seed:admin
```

**Default Credentials:**
- Email: `admin@primetickets.com`
- Password: `Admin@123`
- Mobile: `9999999999`

You can customize these via environment variables:
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_MOBILE`

### 2. `index.js` - Basic Seeder
Creates admin user and default categories.

**Usage:**
```bash
npm run seed
```

### 3. `fullSeeder.js` - Complete Data Seeder ⭐
Creates comprehensive sample data including:
- ✅ Admin user
- ✅ 8 Regular users
- ✅ 5 Organizers
- ✅ 8 Categories
- ✅ 8 Events (with slots, ticket types, and proper relationships)
- ✅ 3 Offers (with promo codes)
- ✅ Sample bookings and payments

**Usage:**
```bash
# Seed without clearing existing data
npm run seed:full

# Clear existing data and seed fresh
npm run seed:full:clear
```

**⚠️ Warning:** The `--clear` flag will delete all non-admin users, categories, events, offers, bookings, and payments before seeding.

## Sample Data Details

### Users
All users have the password: `User@123`
- Rajesh Kumar (rajesh.kumar@email.com)
- Priya Sharma (priya.sharma@email.com)
- Amit Patel (amit.patel@email.com)
- Sneha Reddy (sneha.reddy@email.com)
- Vikram Singh (vikram.singh@email.com)
- Anjali Mehta (anjali.mehta@email.com)
- Rahul Desai (rahul.desai@email.com)
- Kavita Joshi (kavita.joshi@email.com)

### Organizers
All organizers have the password: `Organizer@123`
- Event Masters India (contact@eventmasters.in)
- Concert Hub (info@concerthub.com)
- Sports Events Co. (hello@sportsevents.co)
- Cultural Festivals (team@culturalfestivals.in)
- Tech Conferences (contact@techconferences.com)

### Categories
- Music & Concerts
- Sports & Fitness
- Comedy & Entertainment
- Workshops & Learning
- Food & Drinks
- Arts & Culture
- Business & Networking
- Technology

### Events
The seeder creates 8 diverse events:
1. **Summer Music Festival 2024** - Featured event with multiple slots
2. **Tech Startup Summit** - Featured business/tech event
3. **Comedy Night Special** - Entertainment event
4. **Marathon Run 2024** - Sports event
5. **Food & Wine Festival** - Multi-day food event
6. **Art Exhibition: Modern Masters** - Arts & culture event
7. **Yoga & Meditation Workshop** - Wellness event
8. **Jazz Night Live** - Music event

All events are:
- ✅ Approved and active
- ✅ Have proper slots with dates and times
- ✅ Have multiple ticket types with pricing
- ✅ Assigned to organizers
- ✅ Categorized appropriately
- ✅ Have realistic descriptions and terms

### Offers
Three promotional offers are created:
1. **EARLY20** - 20% off (max ₹500) on all events
2. **WEEKEND200** - Flat ₹200 off on weekend events
3. **MUSIC15** - 15% off (max ₹300) on music events

## Environment Variables

Make sure your `.env.local` or `.env.production` file has:
```env
MONGODB_URI=mongodb://localhost:27017/prime_tickets
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@primetickets.com
ADMIN_PASSWORD=Admin@123
ADMIN_MOBILE=9999999999
```

## Notes

- The seeder checks for existing data and skips creation if records already exist (except when using `--clear`)
- All passwords are hashed using bcrypt
- Events are created with future dates (7-25 days from seeding)
- Bookings are created with successful payment status
- All data is designed to look authentic and realistic

## Troubleshooting

**Error: "Cannot connect to MongoDB"**
- Ensure MongoDB is running
- Check your `MONGODB_URI` in the environment file

**Error: "Duplicate key error"**
- Use `npm run seed:full:clear` to clear existing data first
- Or manually delete the data you want to reseed

**Events not showing in admin panel**
- Ensure events are created with `status: 'approved'`
- Check that organizers are active (`isActive: true`)
