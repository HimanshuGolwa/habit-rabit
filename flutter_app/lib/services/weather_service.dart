import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

class WeatherData {
  final int temp;
  final int code;
  const WeatherData({required this.temp, required this.code});

  /// 'in' = stay indoors (rain/storm/too hot/too cold), 'out' = pleasant.
  String get cond {
    if (code >= 51) return 'in';
    if (temp > 30) return 'in';
    if (temp < 5) return 'in';
    return 'out';
  }

  String get icon {
    const icons = {
      0: '☀', 1: '🌤', 2: '⛅', 3: '☁', 45: '🌫',
      61: '🌧', 63: '🌧', 80: '🌦', 95: '⛈',
    };
    return icons[code] ?? '—';
  }
}

/// Fetches current weather from open-meteo using device location.
/// Returns null if permission is denied or the request fails — the rec engine
/// then treats weather as 'any'.
class WeatherService {
  static Future<WeatherData?> fetch() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        return null;
      }

      final pos = await Geolocator.getCurrentPosition();
      final url = Uri.parse(
          'https://api.open-meteo.com/v1/forecast?latitude=${pos.latitude}'
          '&longitude=${pos.longitude}&current_weather=true'
          '&temperature_unit=celsius&windspeed_unit=ms');

      final res = await http.get(url);
      if (res.statusCode != 200) return null;
      final data = jsonDecode(res.body);
      final w = data['current_weather'];
      return WeatherData(
        temp: (w['temperature'] as num).round(),
        code: (w['weathercode'] as num).toInt(),
      );
    } catch (_) {
      return null;
    }
  }
}
