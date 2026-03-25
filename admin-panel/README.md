# Prime Tickets Admin Panel

Admin Panel for Prime Tickets Event Booking Application built with React, Vite, Zustand, and Tailwind CSS.

## Features

- 🎨 **Magenta Theme** with Dark Mode support
- 🔐 **Authentication** with OTP-based login
- 📱 **Responsive Design** with Tailwind CSS
- 🗂️ **Hash Router** for client-side routing
- 🏪 **Zustand** for state management
- 🔌 **Axios** for API calls with interceptors
- 📊 **Dashboard** with statistics
- 👥 **User Management**
- 📅 **Event Management** and Approval
- 🏷️ **Category Management**
- 🎫 **Offer Management**
- 📈 **Reports & Analytics**

## Tech Stack

- **React 18** - UI Library
- **Vite** - Build Tool
- **React Router DOM** - Routing (Hash Strategy)
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Project Structure

```
admin-panel/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── ProtectedRoute.jsx
│   │   └── layout/
│   │       ├── Layout.jsx
│   │       ├── Header.jsx
│   │       └── Sidebar.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.jsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── users/
│   │   │   └── Users.jsx
│   │   ├── events/
│   │   │   ├── Events.jsx
│   │   │   └── PendingEvents.jsx
│   │   ├── categories/
│   │   │   └── Categories.jsx
│   │   ├── offers/
│   │   │   └── Offers.jsx
│   │   └── reports/
│   │       └── Reports.jsx
│   ├── store/
│   │   ├── authStore.js
│   │   └── themeStore.js
│   ├── utils/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.local
├── .env.production
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Installation

1. Install dependencies:
```bash
cd admin-panel
npm install
```

2. Set up environment variables:
```bash
# Copy and update .env.local for development
cp .env.local .env.local

# Copy and update .env.production for production
cp .env.production .env.production
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Environment Variables

### Development (.env.local)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Prime Tickets Admin
VITE_APP_ENV=development
```

### Production (.env.production)
```
VITE_API_BASE_URL=https://api.primetickets.com/api
VITE_APP_NAME=Prime Tickets Admin
VITE_APP_ENV=production
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Routes

- `/` - Dashboard
- `/login` - Login page
- `/users` - User management
- `/events` - All events
- `/events/pending` - Pending events for approval
- `/categories` - Category management
- `/offers` - Offer management
- `/reports` - Reports and analytics

## Theme

The application uses a magenta color scheme with dark mode support. The theme can be toggled using the theme button in the header.

## Authentication

The admin panel uses OTP-based authentication:
1. Enter mobile number
2. Receive OTP
3. Verify OTP to login

Tokens are stored in localStorage and automatically included in API requests.

