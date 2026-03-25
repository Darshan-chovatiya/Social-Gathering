class ApiConstants {
  // Base URL - Mobile API (customer panel)
  static const String baseUrl = 'http://localhost:5000/api/mobile';

  // Alternative for mobile device testing
  // static const String baseUrl = 'http://10.0.2.2:5000/api/mobile'; // Android Emulator
  // static const String baseUrl = 'http://127.0.0.1:5000/api/mobile'; // iOS Simulator

  // Auth Endpoints
  static const String sendOtp = '/auth/send-otp';
  static const String verifyOtp = '/auth/verify-otp';
  static const String googleSignIn = '/auth/google-signin';
  static const String getCurrentUser = '/auth/me';

  // Public Endpoints (no auth)
  static const String getEvents = '/events';
  static const String getFeaturedEvents = '/events/featured';
  static const String getEventById = '/events';
  static const String getCategories = '/categories';
  static const String getEventOffers = '/offers/event';

  // User Endpoints (auth required - under /user)
  static const String getUserProfile = '/user/profile';
  static const String updateUserProfile = '/user/profile';
  static const String getUpcomingEvents = '/user/upcoming-events';

  // Bookings (auth + mobile verified)
  static const String createBooking = '/bookings';
  static const String getBooking = '/bookings';
  static const String cancelBooking = '/bookings';

  // Payments (auth + mobile verified)
  static const String createPaymentOrder = '/payments/create-order';
  static const String verifyPayment = '/payments/verify';
  static const String getPayment = '/payments';
}

