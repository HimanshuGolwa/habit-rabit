import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

/// Session + auth client. Talks to the Express backend (server/) when wired,
/// mirroring js/auth.js. Update [apiBase] with the deployed Railway URL.
class AuthUser {
  final String id;
  final String name;
  final String email;
  const AuthUser({required this.id, required this.name, required this.email});

  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
        id: j['id'] as String,
        name: j['name'] as String,
        email: j['email'] as String,
      );

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'email': email};
}

class AuthService {
  // TODO: set to your deployed Railway URL in production.
  static const String apiBase = 'http://localhost:3000';

  static const _sessionKey = 'session';
  static const _accessKey = 'access';
  static const _refreshKey = 'refresh';

  final StorageService _store;
  AuthService(this._store);

  AuthUser? get session {
    final j = _store.get<Map<String, dynamic>>(_sessionKey);
    return j == null ? null : AuthUser.fromJson(j);
  }

  bool get isLoggedIn => session != null;

  Future<void> _saveTokens(String access, String refresh) async {
    await _store.set(_accessKey, access);
    await _store.set(_refreshKey, refresh);
  }

  Future<AuthUser> signup(String name, String email, String password) async {
    final res = await http.post(
      Uri.parse('$apiBase/api/auth/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Signup failed.');
    }
    await _saveTokens(data['accessToken'], data['refreshToken']);
    final user = AuthUser.fromJson(data['user']);
    await _store.set(_sessionKey, user.toJson());
    return user;
  }

  Future<AuthUser> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$apiBase/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Login failed.');
    }
    await _saveTokens(data['accessToken'], data['refreshToken']);
    final user = AuthUser.fromJson(data['user']);
    await _store.set(_sessionKey, user.toJson());
    return user;
  }

  Future<void> logout() async {
    final refresh = _store.get<String>(_refreshKey);
    if (refresh != null) {
      try {
        await http.post(
          Uri.parse('$apiBase/api/auth/logout'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'refreshToken': refresh}),
        );
      } catch (_) {/* best effort */}
    }
    await _store.remove(_sessionKey);
    await _store.remove(_accessKey);
    await _store.remove(_refreshKey);
  }

  static bool isValidEmail(String e) =>
      RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(e);
}
