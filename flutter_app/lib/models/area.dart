/// A "neglected area" the user can pick — health, work, etc., or a custom one.
/// `iconKey` maps to an IconData in widgets/area_icons.dart for the defaults,
/// or is a custom-area marker for user-created areas.
class Area {
  final String id;
  final String label;
  final String iconKey;
  final String context;
  final bool neglected;

  const Area({
    required this.id,
    required this.label,
    required this.iconKey,
    this.context = '',
    this.neglected = false,
  });

  factory Area.fromJson(Map<String, dynamic> j) => Area(
        id: j['id'] as String,
        label: j['label'] as String,
        iconKey: j['iconKey'] as String? ?? 'custom',
        context: j['context'] as String? ?? '',
        neglected: j['neglected'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'label': label,
        'iconKey': iconKey,
        'context': context,
        'neglected': neglected,
      };
}
