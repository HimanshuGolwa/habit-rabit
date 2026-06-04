import 'dart:convert';
import 'dart:math';
import 'package:flutter/services.dart' show rootBundle;
import '../models/recommendation.dart';

/// Loads the 500-recommendation pool from assets and runs the same
/// context-aware selection logic as the web app's ai.js getLocalRec().
///
/// This is the seam for the next phase: swap [getRec] for a Claude API call,
/// keeping the same RecResult shape and the UI untouched.
class RecEngine {
  final List<Recommendation> pool;
  final _rng = Random();

  RecEngine(this.pool);

  static Future<RecEngine> load() async {
    final raw = await rootBundle.loadString('assets/rec_pool.json');
    final list = (jsonDecode(raw) as List)
        .map((e) => Recommendation.fromJson(e as Map<String, dynamic>))
        .toList();
    return RecEngine(list);
  }

  static const int _minPool = 4;

  static String timeSlot(int hour) {
    if (hour >= 22 || hour < 5) return 'LN';
    if (hour < 8) return 'EM';
    if (hour < 12) return 'MO';
    if (hour < 14) return 'MD';
    if (hour < 17) return 'AF';
    if (hour < 20) return 'EV';
    return 'NI';
  }

  /// weatherCond: 'in' (bad weather), 'out' (pleasant), or 'any' (unknown).
  RecResult getRec({
    required String energy,
    required String area,
    required String weatherCond,
    DateTime? now,
  }) {
    final t = now ?? DateTime.now();
    final slot = timeSlot(t.hour);
    final timeIsCritical = slot == 'LN' || slot == 'NI';

    List<Recommendation> f(bool Function(Recommendation) test) =>
        pool.where(test).toList();

    final exact = f((r) =>
        r.energy == energy &&
        r.area == area &&
        r.times.contains(slot) &&
        (r.weather == 'any' || r.weather == weatherCond));
    final noWx = f((r) =>
        r.energy == energy && r.area == area && r.times.contains(slot));
    final byTime =
        f((r) => r.energy == energy && r.times.contains(slot)); // keep time
    final byArea = f((r) => r.energy == energy && r.area == area); // keep area
    final byEnergy = f((r) => r.energy == energy);

    // Night protects time-of-day; day protects the chosen area.
    final chain = timeIsCritical
        ? [exact, noWx, byTime, byEnergy]
        : [exact, noWx, byArea, byEnergy];

    List<Recommendation> selected = chain.firstWhere(
      (p) => p.length >= _minPool,
      orElse: () => chain.reversed.firstWhere(
        (p) => p.isNotEmpty,
        orElse: () => pool,
      ),
    );

    final shuffled = [...selected]..shuffle(_rng);
    final main = shuffled.first;
    final alts = shuffled.skip(1).take(3).toList();

    return RecResult(main: main, alternatives: alts);
  }
}
