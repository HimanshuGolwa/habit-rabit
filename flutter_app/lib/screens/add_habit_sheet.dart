import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/app_state.dart';
import '../data/default_areas.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'sheet_helpers.dart';

Future<void> showAddHabitSheet(BuildContext context) {
  return showGlassSheet(context, (ctx) => const _AddHabitSheet());
}

class _AddHabitSheet extends StatefulWidget {
  const _AddHabitSheet();

  @override
  State<_AddHabitSheet> createState() => _AddHabitSheetState();
}

class _AddHabitSheetState extends State<_AddHabitSheet> {
  final _nameCtrl = TextEditingController();
  final _iconCtrl = TextEditingController();
  String? _areaId;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _iconCtrl.dispose();
    super.dispose();
  }

  void _save() {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter a habit name.')));
      return;
    }
    context
        .read<AppState>()
        .addHabit(name, _iconCtrl.text.trim(), _areaId);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final p = GlassPalette.of(Theme.of(context).brightness);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('New habit',
            style: TextStyle(
                fontFamily: 'GoogleSansDisplay',
                fontSize: 20,
                fontWeight: FontWeight.w500,
                color: p.t1)),
        const SizedBox(height: 18),
        sheetInput(_nameCtrl, 'Habit name', p),
        const SizedBox(height: 10),
        sheetInput(_iconCtrl, 'Icon (emoji optional)', p),
        const SizedBox(height: 16),
        Row(
          children: [
            Text('NEGLECTED AREA',
                style: TextStyle(
                    color: p.t3, fontSize: 12, fontWeight: FontWeight.w500)),
            const SizedBox(width: 6),
            Text('(optional)',
                style: TextStyle(color: p.t3, fontSize: 11)),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: state.allAreas.map((a) {
            final active = _areaId == a.id;
            return GestureDetector(
              onTap: () =>
                  setState(() => _areaId = active ? null : a.id),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
                decoration: BoxDecoration(
                  color: active
                      ? AppColors.accent.withValues(alpha: 0.1)
                      : p.glassMd,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: active ? AppColors.accent : p.glassBorder,
                      width: 1.5),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(areaIcon(a.iconKey),
                        size: 14,
                        color: active ? AppColors.accent : p.t2),
                    const SizedBox(width: 6),
                    Text(a.label,
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: active ? AppColors.accent : p.t2)),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 18),
        GradientButton(label: 'Add habit', onPressed: _save),
        const SizedBox(height: 8),
        Center(
          child: TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancel', style: TextStyle(color: p.t3)),
          ),
        ),
      ],
    );
  }
}
