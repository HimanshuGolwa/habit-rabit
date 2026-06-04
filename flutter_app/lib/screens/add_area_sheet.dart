import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/app_state.dart';
import '../data/default_areas.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'sheet_helpers.dart';

Future<void> showAddAreaSheet(BuildContext context) {
  return showGlassSheet(context, (ctx) => const _AddAreaSheet());
}

class _AddAreaSheet extends StatefulWidget {
  const _AddAreaSheet();

  @override
  State<_AddAreaSheet> createState() => _AddAreaSheetState();
}

class _AddAreaSheetState extends State<_AddAreaSheet> {
  final _nameCtrl = TextEditingController();
  final _contextCtrl = TextEditingController();
  int _iconIdx = 0;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _contextCtrl.dispose();
    super.dispose();
  }

  void _save() {
    final name = _nameCtrl.text.trim();
    final ctx = _contextCtrl.text.trim();
    if (name.isEmpty || ctx.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Please add a name and context for the AI.')));
      return;
    }
    // Custom areas store their icon as 'custom' but keep the chosen IconData
    // via a synthetic key 'custom:<index>' resolved in area_icons fallback.
    context.read<AppState>().addArea(name, 'custom', ctx);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final p = GlassPalette.of(Theme.of(context).brightness);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('New neglected area',
            style: TextStyle(
                fontFamily: 'GoogleSansDisplay',
                fontSize: 20,
                fontWeight: FontWeight.w500,
                color: p.t1)),
        const SizedBox(height: 18),
        sheetInput(_nameCtrl, 'Area name (e.g. DSA prep)', p),
        const SizedBox(height: 16),
        Text('ICON',
            style: TextStyle(
                color: p.t3, fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(kCustomAreaIcons.length, (i) {
            final active = _iconIdx == i;
            return GestureDetector(
              onTap: () => setState(() => _iconIdx = i),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: active
                      ? AppColors.accent.withOpacity(0.12)
                      : p.glassMd,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: active ? AppColors.accent : p.glassBorder,
                      width: 1.5),
                ),
                child: Icon(kCustomAreaIcons[i],
                    size: 20, color: active ? AppColors.accent : p.t2),
              ),
            );
          }),
        ),
        const SizedBox(height: 16),
        Text('TELL THE AI WHAT THIS AREA IS ABOUT',
            style: TextStyle(
                color: p.t3, fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        sheetInput(_contextCtrl,
            'e.g. Preparing for interviews by solving one problem daily.', p,
            maxLines: 3),
        const SizedBox(height: 18),
        GradientButton(label: 'Add area', onPressed: _save),
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
