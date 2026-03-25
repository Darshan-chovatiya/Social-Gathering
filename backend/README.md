# Prime Tickets Backend API

Backend API for Prime Tickets Event Booking Application built with Node.js, Express, and MongoDB.

## Project Structure

```
backend/
├── config/              # Configuration files
│   ├── database.js      # Database connection
│   ├── cors.js          # CORS configuration
│   ├── env.js           # Environment variables
│   ├── logger.js        # Logging utility
│   └── index.js         # Config exports
├── controllers/         # Business logic controllers
│   ├── admin.controller.js
│   ├── auth.controller.js
│   ├── booking.controller.js
│   ├── category.controller.js
│   ├── event.controller.js
│   ├── offer.controller.js
│   ├── organizer.controller.js
│   ├── payment.controller.js
│   ├── report.controller.js
│   └── user.controller.js
├── middleware/          # Express middleware
│   ├── auth.js         # Authentication & authorization
│   └── validate.js     # Request validation
├── models/             # MongoDB models
│   ├── Booking.js
│   ├── Category.js
│   ├── Event.js
│   ├── Offer.js
│   ├── Payment.js
│   └── User.js
├── routes/             # API routes (organized by user type)
│   ├── admin/          # Admin routes
│   │   └── index.js
│   ├── organizer/      # Organizer routes
│   │   ├── index.js
│   │   └── reports.js
│   ├── users/          # User routes
│   │   ├── index.js
│   │   ├── booking.js
│   │   └── payment.js
│   ├── public/         # Public routes (no auth)
│   │   ├── events.js
│   │   ├── categories.js
│   │   └── offers.js
│   └── auth.js        # Authentication routes
├── seeders/            # Database seeders
│   ├── adminSeeder.js  # Admin user seeder
│   ├── index.js        # Full database seeder
│   └── README.md       # Seeder documentation
├── utils/              # Utility functions
│   ├── asyncHandler.js
│   ├── generateToken.js
│   ├── response.js     # Standardized response format
│   └── sendOTP.js
├── validators/         # Request validators
│   ├── admin.validator.js
│   ├── auth.validator.js
│   ├── booking.validator.js
│   ├── category.validator.js
│   ├── event.validator.js
│   ├── offer.validator.js
│   ├── payment.validator.js
│   └── user.validator.js
├── uploads/            # File uploads directory
├── .env.local          # Local development environment variables
├── .env.production     # Production environment variables
├── .env.example        # Environment variables template
├── .gitignore
├── package.json
├── server.js           # Application entry point
└── README.md
```

## Response Format

All API responses follow a consistent format:

```json
{
  "status": 200,
  "message": "Success message",
  "result": {
    // Dynamic data
  }
}
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# For local development
cp .env.example .env.local

# For production
cp .env.example .env.production
```

3. Update environment files with your configuration values.

4. Seed the database (create admin user and default categories):
```bash
# Seed admin user only
npm run seed:admin

# Seed all data (admin + categories)
npm run seed
```

5. Start the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Development mode (with file watching)
npm run dev:watch

# Production mode
npm start
# or
npm run prod
```

## Environment Configuration

### Development Environment

The development environment uses `.env.local` file:
- Detailed error logging
- Console OTP (no Twilio required)
- Local MongoDB connection
- CORS allows localhost origins
- Request/response logging enabled

### Production Environment

The production environment uses `.env.production` file:
- Minimal error logging (no stack traces in responses)
- Twilio integration for OTP
- Production MongoDB connection
- CORS restricted to production domains
- Optimized logging

### Environment Variables

Key environment variables:

- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT token expiration (default: 7d)
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay API secret
- `TWILIO_ACCOUNT_SID` - Twilio account SID (production only)
- `TWILIO_AUTH_TOKEN` - Twilio auth token (production only)
- `TWILIO_PHONE_NUMBER` - Twilio phone number (production only)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

## API Endpoints

### Public Routes (No Authentication)

#### Authentication
- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `POST /api/auth/google-signin` - Google Sign-In
- `GET /api/auth/me` - Get current user (requires auth)

#### Events
- `GET /api/events` - Get all events (with filters)
- `GET /api/events/featured` - Get featured events
- `GET /api/events/:id` - Get event by ID

#### Categories
- `GET /api/categories` - Get all active categories

#### Offers
- `GET /api/offers/event/:eventId` - Get offers for an event

---

### User Routes (Authentication Required)

#### Profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/upcoming-events` - Get upcoming events

#### Bookings
- `POST /api/users/bookings` - Create booking
- `GET /api/users/bookings/:id` - Get booking by ID
- `PUT /api/users/bookings/:id/cancel` - Cancel booking

#### Payments
- `POST /api/users/payments/create-order` - Create Razorpay order
- `POST /api/users/payments/verify` - Verify payment
- `GET /api/users/payments/:id` - Get payment by ID

---

### Organizer Routes (Organizer Authentication Required)

#### Events
- `GET /api/organizer/events` - Get my events
- `POST /api/organizer/events` - Create event
- `GET /api/organizer/events/:id` - Get event by ID
- `PUT /api/organizer/events/:id` - Update event
- `DELETE /api/organizer/events/:id` - Delete event

#### Bookings & Stats
- `GET /api/organizer/events/:eventId/bookings` - Get event bookings
- `GET /api/organizer/events/:eventId/stats` - Get event statistics

#### Offers
- `GET /api/organizer/offers` - Get all offers
- `POST /api/organizer/offers` - Create offer (for own events)
- `PUT /api/organizer/offers/:id` - Update offer
- `DELETE /api/organizer/offers/:id` - Delete offer

#### Reports
- `GET /api/organizer/reports/event-wise-bookings` - Event-wise booking report
- `GET /api/organizer/reports/revenue` - Revenue report (own events)
- `GET /api/organizer/reports/category-wise-sales` - Category-wise sales (own events)

---

### Admin Routes (Admin Authentication Required)

#### User Management
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `PUT /api/admin/users/:id/role` - Update user role

#### Event Management
- `GET /api/admin/events` - Get all events
- `GET /api/admin/events/pending` - Get pending events
- `PUT /api/admin/events/:id/approve` - Approve event
- `PUT /api/admin/events/:id/reject` - Reject event
- `PUT /api/admin/events/:id/feature` - Feature/unfeature event

#### Category Management
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

#### Offer Management
- `GET /api/admin/offers` - Get all offers
- `POST /api/admin/offers` - Create offer (global/category)
- `PUT /api/admin/offers/:id` - Update offer
- `DELETE /api/admin/offers/:id` - Delete offer

#### Reports
- `GET /api/admin/reports/event-wise-bookings` - Event-wise booking report
- `GET /api/admin/reports/revenue` - Revenue report (all events)
- `GET /api/admin/reports/category-wise-sales` - Category-wise sales (all events)
- `GET /api/admin/reports/user-engagement` - User engagement analytics

---

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## User Roles

- **user**: Regular customer
- **organizer**: Event organizer
- **admin**: Platform administrator

## Development vs Production

### Development Mode
- Detailed error messages with stack traces
- Console logging for debugging
- OTP logged to console (no Twilio required)
- CORS allows all localhost origins
- Request/response logging enabled

### Production Mode
- Minimal error messages (no stack traces)
- Structured logging
- Twilio integration for OTP
- CORS restricted to configured origins
- Optimized performance

## Logging

The application uses a custom logger that adapts based on environment:

- **Development**: Detailed logs with debug information
- **Production**: Structured logs without sensitive data

## Environment Files

- **`.env.local`** - Local development environment (not committed to git)
- **`.env.production`** - Production environment (not committed to git)
- **`.env.example`** - Template file (committed to git as reference)

The application automatically loads:
- `.env.local` when `NODE_ENV=development` (default)
- `.env.production` when `NODE_ENV=production`

## Security Notes

1. **Never commit `.env.local` or `.env.production` files** - They are in `.gitignore`
2. **Use strong JWT secrets** in production
3. **Configure CORS properly** for production
4. **Use HTTPS** in production
5. **Keep dependencies updated** regularly
