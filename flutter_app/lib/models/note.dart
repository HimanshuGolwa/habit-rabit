/// A dated note attached to a habit, tagged with the energy level the user
/// selected when logging it.
class HabitNote {
  final int ts; // epoch millis
  final String text;
  final String? energy; // depleted | low | medium | high | null

  const HabitNote({required this.ts, required this.text, this.energy});

  factory HabitNote.fromJson(Map<String, dynamic> j) => HabitNote(
        ts: j['ts'] as int,
        text: j['text'] as String,
        energy: j['energy'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'ts': ts,
        'text': text,
        'energy': energy,
      };
}
