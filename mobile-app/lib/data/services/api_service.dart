import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/api_constants.dart';

class ApiService {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            // Handle unauthorized - clear token and redirect to login
            _storage.delete(key: 'auth_token');
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Auth Methods
  Future<Response> sendOtp(String mobile) async {
    return await _dio.post(ApiConstants.sendOtp, data: {'mobile': mobile});
  }

  Future<Response> verifyOtp({
    required String mobile,
    required String otp,
    String? name,
    String? email,
  }) async {
    return await _dio.post(
      ApiConstants.verifyOtp,
      data: {
        'mobile': mobile,
        'otp': otp,
        if (name != null) 'name': name,
        if (email != null) 'email': email,
      },
    );
  }

  Future<Response> googleSignIn({
    required String idToken,
    String? mobile,
  }) async {
    return await _dio.post(
      ApiConstants.googleSignIn,
      data: {
        'idToken': idToken,
        if (mobile != null) 'mobile': mobile,
      },
    );
  }

  Future<Response> getCurrentUser() async {
    return await _dio.get(ApiConstants.getCurrentUser);
  }

  // Public Endpoints
  Future<Response> getEvents({
    Map<String, dynamic>? queryParameters,
  }) async {
    return await _dio.get(
      ApiConstants.getEvents,
      queryParameters: queryParameters,
    );
  }

  Future<Response> getFeaturedEvents() async {
    return await _dio.get(ApiConstants.getFeaturedEvents);
  }

  Future<Response> getEventById(String eventId) async {
    return await _dio.get('${ApiConstants.getEventById}/$eventId');
  }

  Future<Response> getCategories() async {
    return await _dio.get(ApiConstants.getCategories);
  }

  Future<Response> getEventOffers(String eventId) async {
    return await _dio.get('${ApiConstants.getEventOffers}/$eventId');
  }

  // User Endpoints
  Future<Response> getUserProfile() async {
    return await _dio.get(ApiConstants.getUserProfile);
  }

  Future<Response> updateUserProfile(Map<String, dynamic> data) async {
    return await _dio.put(ApiConstants.updateUserProfile, data: data);
  }

  Future<Response> getUpcomingEvents() async {
    return await _dio.get(ApiConstants.getUpcomingEvents);
  }

  Future<Response> createBooking(Map<String, dynamic> data) async {
    return await _dio.post(ApiConstants.createBooking, data: data);
  }

  Future<Response> getBooking(String bookingId) async {
    return await _dio.get('${ApiConstants.getBooking}/$bookingId');
  }

  Future<Response> cancelBooking(String bookingId) async {
    return await _dio.put('${ApiConstants.cancelBooking}/$bookingId/cancel');
  }

  Future<Response> createPaymentOrder(Map<String, dynamic> data) async {
    return await _dio.post(ApiConstants.createPaymentOrder, data: data);
  }

  Future<Response> verifyPayment(Map<String, dynamic> data) async {
    return await _dio.post(ApiConstants.verifyPayment, data: data);
  }

  Future<Response> getPayment(String paymentId) async {
    return await _dio.get('${ApiConstants.getPayment}/$paymentId');
  }
}

