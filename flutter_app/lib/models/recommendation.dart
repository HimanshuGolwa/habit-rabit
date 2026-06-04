/// A single recommendation from the pool, plus the result bundle returned by
/// the rec engine (one main + up to three alternatives).
class Recommendation {
  final String energy;
  final String area;
  final List<String> times;
  final String weather; // any | in | out
  final int minutes;
  final String label;
  final String text;

  const Recommendation({
    required this.energy,
    required this.area,
    required this.times,
    required this.weather,
    required this.minutes,
    required this.label,
    required this.text,
  });

  factory Recommendation.fromJson(Map<String, dynamic> j) => Recommendation(
        energy: j['e'] as String,
        area: j['a'] as String,
        times: (j['t'] as List).map((e) => e as String).toList(),
        weather: j['w'] as String,
        minutes: j['mins'] as int,
        label: j['label'] as String,
        text: j['text'] as String,
      );
}

class RecResult {
  final Recommendation main;
  final List<Recommendation> alternatives;
  const RecResult({required this.main, required this.alternatives});
}
