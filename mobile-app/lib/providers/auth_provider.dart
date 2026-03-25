import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../data/models/user_model.dart';
import '../data/services/api_service.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ref.read(apiServiceProvider)),
);

class AuthState {
  final UserModel? user;
  final String? token;
  final bool isLoading;
  final String? error;

  AuthState({
    this.user,
    this.token,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => user != null && token != null;

  AuthState copyWith({
    UserModel? user,
    String? token,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthNotifier(this._apiService) : super(AuthState()) {
    _loadAuth();
  }

  Future<void> _loadAuth() async {
    state = state.copyWith(isLoading: true);
    try {
      final token = await _storage.read(key: 'auth_token');
      if (token != null) {
        final response = await _apiService.getCurrentUser();
        if (response.statusCode == 200 && response.data['status'] == 200) {
          final userData = response.data['result']['user'];
          state = state.copyWith(
            user: UserModel.fromJson(userData),
            token: token,
            isLoading: false,
          );
        } else {
          await logout();
        }
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> sendOtp(String mobile) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiService.sendOtp(mobile);
      if (response.statusCode == 200) {
        state = state.copyWith(isLoading: false);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data['message'] ?? 'Failed to send OTP',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<bool> verifyOtp({
    required String mobile,
    required String otp,
    String? name,
    String? email,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiService.verifyOtp(
        mobile: mobile,
        otp: otp,
        name: name,
        email: email,
      );
      if (response.statusCode == 200 && response.data['status'] == 200) {
        final token = response.data['result']['token'];
        final userData = response.data['result']['user'];
        await _storage.write(key: 'auth_token', value: token);
        state = state.copyWith(
          user: UserModel.fromJson(userData),
          token: token,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data['message'] ?? 'OTP verification failed',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    state = AuthState();
  }
}

