import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/app_state.dart';
import '../models/habit.dart';
import '../data/default_areas.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'add_habit_sheet.dart';
import 'habit_detail_sheet.dart';

class HabitsScreen extends StatelessWidget {
  const HabitsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final p = GlassPalette.of(Theme.of(context).brightness);

    final today = DateTime.now();
    final week = List.generate(7, (i) {
      final d = today.subtract(Duration(days: 6 - i));
      return d.toIso8601String().substring(0, 10);
    });
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    final todayStr = today.toIso8601String().substring(0, 10);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('YOUR HABITS',
                style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 1.5,
                    color: p.t3,
                    fontWeight: FontWeight.w500)),
            GestureDetector(
              onTap: () => showAddHabitSheet(context),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: p.glassMd,
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  border: Border.all(color: p.glassBorder),
                ),
                child: Row(
                  children: [
                    Icon(Icons.add, size: 16, color: p.t2),
                    const SizedBox(width: 6),
                    Text('New habit',
                        style: TextStyle(color: p.t2, fontSize: 13)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (state.habits.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 48),
            child: Center(
              child: Text('No habits yet. Add your first one.',
                  style: TextStyle(color: p.t3, fontSize: 14)),
            ),
          )
        else
          ...state.habits.map((h) =>
              _habitCard(context, state, h, week, dayLabels, todayStr, p)),
      ],
    );
  }

  Widget _habitCard(BuildContext context, AppState state, Habit h,
      List<String> week, List<String> dayLabels, String todayStr,
      GlassPalette p) {
    final area = h.areaId != null
        ? state.allAreas.where((a) => a.id == h.areaId).firstOrNull
        : null;
    final streak = h.currentStreak;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GestureDetector(
              onTap: () => showHabitDetail(context, h.id),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${h.icon} ${h.name}'.trim(),
                            style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                                color: p.t1)),
                        if (area != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 3),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(areaIcon(area.iconKey),
                                    size: 12, color: p.t3),
                                const SizedBox(width: 5),
                                Text(area.label,
                                    style: TextStyle(
                                        fontSize: 11, color: p.t3)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (streak > 1)
                    Text('$streak day streak',
                        style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.accent,
                            fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: List.generate(7, (i) {
                final done = h.log.contains(week[i]);
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: i < 6 ? 6 : 0),
                    child: GestureDetector(
                      onTap: () => state.toggleDay(h.id, week[i]),
                      child: Container(
                        height: 30,
                        decoration: BoxDecoration(
                          color: done
                              ? AppColors.accent.withValues(alpha: 0.2)
                              : p.glassMd,
                          shape: BoxShape.rectangle,
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(
                              color: done
                                  ? AppColors.accent
                                  : p.glassBorder),
                        ),
                        alignment: Alignment.center,
                        child: Text(dayLabels[i],
                            style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w500,
                                color: done ? AppColors.accent : p.t3)),
                      ),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _actionBtn(
                    h.doneToday ? '✓ Done today' : 'Mark done',
                    () => state.toggleDay(h.id, todayStr),
                    p,
                    accent: true,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _actionBtn(
                      'Details', () => showHabitDetail(context, h.id), p),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _actionBtn('Delete', () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Delete this habit?'),
                        actions: [
                          TextButton(
                              onPressed: () => Navigator.pop(ctx),
                              child: const Text('Cancel')),
                          TextButton(
                              onPressed: () {
                                state.deleteHabit(h.id);
                                Navigator.pop(ctx);
                              },
                              child: const Text('Delete',
                                  style: TextStyle(color: AppColors.danger))),
                        ],
                      ),
                    );
                  }, p, danger: true),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionBtn(String label, VoidCallback onTap, GlassPalette p,
      {bool accent = false, bool danger = false}) {
    final color = danger
        ? AppColors.danger
        : accent
            ? AppColors.accent
            : p.t2;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: p.glassMd,
          borderRadius: BorderRadius.circular(AppTheme.radiusSm),
          border: Border.all(
              color: danger
                  ? AppColors.danger.withValues(alpha: 0.2)
                  : accent
                      ? AppColors.accent.withValues(alpha: 0.3)
                      : p.glassBorder),
        ),
        alignment: Alignment.center,
        child: Text(label,
            style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w500, color: color)),
      ),
    );
  }
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
