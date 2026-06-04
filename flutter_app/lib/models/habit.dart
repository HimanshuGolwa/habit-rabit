import 'note.dart';

/// A tracked habit. `log` is a list of ISO date strings (YYYY-MM-DD) on which
/// the habit was completed. `areaId` optionally links it to a neglected area.
class Habit {
  final String id;
  String name;
  String icon; // emoji or empty
  String? areaId;
  List<String> log;
  List<HabitNote> notes;

  Habit({
    required this.id,
    required this.name,
    this.icon = '',
    this.areaId,
    List<String>? log,
    List<HabitNote>? notes,
  })  : log = log ?? [],
        notes = notes ?? [];

  factory Habit.fromJson(Map<String, dynamic> j) => Habit(
        id: j['id'] as String,
        name: j['name'] as String,
        icon: j['icon'] as String? ?? '',
        areaId: j['areaId'] as String?,
        log: (j['log'] as List?)?.map((e) => e as String).toList() ?? [],
        notes: (j['notes'] as List?)
                ?.map((e) => HabitNote.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'icon': icon,
        'areaId': areaId,
        'log': log,
        'notes': notes.map((n) => n.toJson()).toList(),
      };

  // ── STREAK HELPERS (ported from habits.js) ───────────────────────
  static String _today() => DateTime.now().toIso8601String().substring(0, 10);

  int get currentStreak {
    if (log.isEmpty) return 0;
    final sorted = log.toSet().toList()..sort((a, b) => b.compareTo(a));
    if (sorted.first != _today()) return 0;
    var streak = 1;
    for (var i = 1; i < sorted.length; i++) {
      final prev = DateTime.parse(sorted[i - 1]);
      final curr = DateTime.parse(sorted[i]);
      if (prev.difference(curr).inDays == 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  int get bestStreak {
    if (log.isEmpty) return 0;
    final sorted = log.toSet().toList()..sort();
    var best = 1, cur = 1;
    for (var i = 1; i < sorted.length; i++) {
      final prev = DateTime.parse(sorted[i - 1]);
      final curr = DateTime.parse(sorted[i]);
      if (curr.difference(prev).inDays == 1) {
        cur++;
        if (cur > best) best = cur;
      } else {
        cur = 1;
      }
    }
    return best;
  }

  bool get doneToday => log.contains(_today());
}
