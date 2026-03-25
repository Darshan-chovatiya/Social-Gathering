# Mobile API – Customer Panel

All backend APIs required for the customer panel and mobile app are exposed under **`/api/mobile`**.

Use **base URL**: `http://<host>:<port>/api/mobile`

---

## Auth (no auth unless noted)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/send-otp` | No | Send OTP to mobile |
| POST | `/auth/verify-otp` | No | Verify OTP, login/register |
| POST | `/auth/google-signin` | No | Google Sign-In |
| GET | `/auth/me` | Yes | Current user |

---

## Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List events (query: category, location, search, date, minPrice, maxPrice, page, limit) |
| GET | `/events/featured` | Featured events |
| GET | `/events/banners/active` | Active banners |
| GET | `/events/:id` | Event by ID |
| GET | `/categories` | Active categories |
| GET | `/offers/event/:eventId` | Offers for event |
| GET | `/affiliate/:code` | Validate affiliate code |

---

## User (auth required)

Mount base: **`/user`** (e.g. `/api/mobile/user/profile`).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user/profile` | Yes | Get profile |
| PUT | `/user/profile` | Yes | Update profile (optional profilePicture) |
| PUT | `/user/change-password` | Yes | Change password |
| GET | `/user/upcoming-events` | Yes + mobile verified | Upcoming confirmed events |
| GET | `/user/banners/active` | Yes | Active banners |
| GET | `/user/events` | Yes | Events list (future slots filter) |
| GET | `/user/events/featured` | Yes | Featured events |
| GET | `/user/events/:id` | Yes | Event by ID |
| GET | `/user/categories` | Yes | Categories |
| GET | `/user/events/:eventId/offers` | Yes + mobile verified | Offers for event (with isAlreadyUsed) |
| GET | `/user/sponsors/:id` | Yes | Sponsor by ID |

---

## Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/bookings/verify-qr` | No | Verify QR / ticket |
| GET | `/bookings` | Yes + mobile verified | My bookings (query: status, page, limit) |
| POST | `/bookings` | Yes + mobile verified | Create booking |
| GET | `/bookings/:id` | Yes + mobile verified | Booking by ID |
| PUT | `/bookings/:id/cancel` | Yes + mobile verified | Cancel booking |

---

## Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments/razorpay-key` | No | Razorpay key ID |
| POST | `/payments/create-razorpay-order` | No | Create Razorpay order (amount, currency, receipt) |
| POST | `/payments/create-order` | Yes + mobile verified | Create payment order (bookingId or bookingData) |
| POST | `/payments/verify` | Yes + mobile verified | Verify payment |
| POST | `/payments/store` | Yes + mobile verified | Store payment after success |
| GET | `/payments/booking/:bookingId` | Yes + mobile verified | Payment by booking ID |
| GET | `/payments/:id` | Yes + mobile verified | Payment by ID |

---

## Affiliate links (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/affiliate-links/my-links` | My affiliate links |
| GET | `/affiliate-links/:linkId` | Link details |
| GET | `/affiliate-links/:linkId/referrals` | Referrals for link |

---

## Response format

All responses use:

```json
{
  "status": 200,
  "message": "Success message",
  "result": { ... }
}
```

Errors: same shape with `status` ≥ 400 and `message` describing the error.

---

## Authorization

Send JWT for protected routes:

```
Authorization: Bearer <token>
```

Roles: `user` (customer). Mobile verification is required for bookings and payments.
