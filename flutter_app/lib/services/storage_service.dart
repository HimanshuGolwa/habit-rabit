import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Thin wrapper over SharedPreferences that mirrors the JS `S` helper
/// (localStorage with an `hr_` prefix and JSON encoding).
class StorageService {
  static const _prefix = 'hr_';
  final SharedPreferences _prefs;

  StorageService(this._prefs);

  static Future<StorageService> create() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs);
  }

  T? get<T>(String key) {
    final raw = _prefs.getString(_prefix + key);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as T;
    } catch (_) {
      return null;
    }
  }

  Future<void> set(String key, Object? value) async {
    await _prefs.setString(_prefix + key, jsonEncode(value));
  }

  Future<void> remove(String key) async {
    await _prefs.remove(_prefix + key);
  }

  Future<void> clear() async {
    final keys = _prefs.getKeys().where((k) => k.startsWith(_prefix)).toList();
    for (final k in keys) {
      await _prefs.remove(k);
    }
  }
}
