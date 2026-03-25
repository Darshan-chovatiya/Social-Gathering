# Prime Tickets Mobile App

Flutter mobile application for Prime Tickets Event Booking Platform.

## Features

- 🔐 **Authentication**: OTP-based login and Google Sign-In
- 🎫 **Event Discovery**: Browse and search events
- 📅 **Event Details**: View event information, slots, and ticket types
- 💳 **Ticket Booking**: Book tickets with payment integration
- 📱 **Booking History**: View past and upcoming bookings
- 👤 **Profile Management**: Manage user profile
- 🌙 **Dark Mode**: Full dark mode support
- 🎨 **Magenta Theme**: Beautiful magenta color scheme

## Tech Stack

- **Flutter**: UI Framework
- **Riverpod**: State Management
- **Go-Router**: Navigation
- **Dio**: HTTP Client
- **Razorpay**: Payment Gateway
- **Google Maps**: Location Services

## Setup Instructions

1. **Install Flutter**: Make sure Flutter is installed and configured
   ```bash
   flutter --version
   ```

2. **Install Dependencies**:
   ```bash
   cd mobile-app
   flutter pub get
   ```

3. **Generate Code** (for JSON serialization):
   ```bash
   flutter pub run build_runner build
   ```

4. **Update API Base URL**:
   - Edit `lib/core/constants/api_constants.dart`
   - Update `baseUrl` to match your backend server

5. **Run the App**:
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
├── core/
│   ├── constants/     # App constants and API endpoints
│   ├── theme/         # Theme configuration
│   └── utils/         # Utility functions
├── data/
│   ├── models/        # Data models
│   ├── repositories/  # Data repositories
│   └── services/      # API services
├── presentation/
│   ├── screens/       # UI screens
│   ├── widgets/      # Reusable widgets
│   └── router/       # Navigation configuration
└── providers/         # Riverpod providers
```

## Configuration

### API Configuration
Update the base URL in `lib/core/constants/api_constants.dart`:
- For Android Emulator: `http://10.0.2.2:5000/api`
- For iOS Simulator: `http://127.0.0.1:5000/api`
- For Physical Device: Your computer's IP address

### Payment Integration
Configure Razorpay keys in your backend. The mobile app will use the backend API for payment processing.

## Development

### Running in Debug Mode
```bash
flutter run
```

### Building for Release
```bash
flutter build apk  # Android
flutter build ios  # iOS
```

## Notes

- The app uses secure storage for authentication tokens
- OTP verification is required for all users
- Google Sign-In requires additional configuration
- Payment integration uses Razorpay through backend API

