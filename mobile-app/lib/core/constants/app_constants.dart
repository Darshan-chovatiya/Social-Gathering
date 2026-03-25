class AppConstants {
  // App Info
  static const String appName = 'Prime Tickets';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';
  
  // OTP
  static const int otpLength = 6;
  static const int otpResendDelay = 60; // seconds
  
  // Pagination
  static const int defaultPageSize = 20;
  
  // Image Placeholders
  static const String eventPlaceholder = 'https://via.placeholder.com/400x300?text=Event+Image';
  static const String userPlaceholder = 'https://via.placeholder.com/200?text=User';
  
  // Date Formats
  static const String dateFormat = 'MMM d, yyyy';
  static const String timeFormat = 'h:mm a';
  static const String dateTimeFormat = 'MMM d, yyyy h:mm a';
}

