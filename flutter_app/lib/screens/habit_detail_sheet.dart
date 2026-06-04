import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../services/app_state.dart';
import '../models/habit.dart';
import '../theme/app_theme.dart';

/// Fixed-height detail popup (consistent across Month/Year/Notes tabs),
/// mirroring the .modal-sheet-tall behaviour from the web app.
Future<void> showHabitDetail(BuildContext context, String habitId) {
  final p = GlassPalette.of(Theme.of(context).brightness);
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          height: MediaQuery.of(ctx).size.height * 0.78,
          decoration: BoxDecoration(
            color: p.bg2,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(color: p.glassBorder),
          ),
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
          child: _HabitDetail(habitId: habitId),
        ),
      ),
    ),
  );
}

class _HabitDetail extends StatefulWidget {
  final String habitId;
  const _HabitDetail({required this.habitId});

  @override
  State<_HabitDetail> createState() => _HabitDetailState();
}

class _HabitDetailState extends State<_HabitDetail> {
  int _tab = 0; // 0 month, 1 year, 2 notes
  final _noteCtrl = TextEditingController();
  String? _noteEnergy;

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final p = GlassPalette.of(Theme.of(context).brightness);
    final h = state.habits.firstWhere((x) => x.id == widget.habitId);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text('${h.icon} ${h.name}'.trim(),
                  style: TextStyle(
                      fontFamily: 'GoogleSansDisplay',
                      fontSize: 22,
                      fontWeight: FontWeight.w500,
                      color: p.t1)),
            ),
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Icon(Icons.close, color: p.t2, size: 22),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _stats(h, p),
        const SizedBox(height: 16),
        _tabBar(p),
        const SizedBox(height: 16),
        Expanded(
          child: SingleChildScrollView(
            child: _tab == 0
                ? _monthCalendar(h, p)
                : _tab == 1
                    ? _yearGrid(h, p)
                    : _notes(state, h, p),
          ),
        ),
      ],
    );
  }

  Widget _stats(Habit h, GlassPalette p) {
    final thisMonth = h.log
        .where((d) => d.startsWith(
            DateTime.now().toIso8601String().substring(0, 7)))
        .length;
    final daysInMonth =
        DateTime(DateTime.now().year, DateTime.now().month + 1, 0).day;
    final rate = ((thisMonth / daysInMonth) * 100).round();

    Widget stat(String v, String l) => Expanded(
          child: Column(
            children: [
              Text(v,
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                      color: AppColors.accent)),
              const SizedBox(height: 2),
              Text(l.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 10, color: p.t3)),
            ],
          ),
        );

    return Row(children: [
      stat('${h.currentStreak}', 'Current streak'),
      stat('${h.bestStreak}', 'Best streak'),
      stat('$thisMonth', 'This month'),
      stat('$rate%', 'Completion'),
    ]);
  }

  Widget _tabBar(GlassPalette p) {
    const labels = ['Month', 'Year', 'Notes'];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: p.glassMd,
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        border: Border.all(color: p.glassBorder),
      ),
      child: Row(
        children: List.generate(3, (i) {
          final active = _tab == i;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _tab = i),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: active ? p.glassHi : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(labels[i],
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: active ? p.t1 : p.t2)),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ── MONTH ──────────────────────────────────────────────────────────
  Widget _monthCalendar(Habit h, GlassPalette p) {
    final now = DateTime.now();
    final firstWeekday = DateTime(now.year, now.month, 1).weekday % 7; // Sun=0
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final todayStr = now.toIso8601String().substring(0, 10);
    const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    final cells = <Widget>[];
    for (var i = 0; i < firstWeekday; i++) {
      cells.add(const SizedBox());
    }
    for (var d = 1; d <= daysInMonth; d++) {
      final ds =
          '${now.year}-${now.month.toString().padLeft(2, '0')}-${d.toString().padLeft(2, '0')}';
      final done = h.log.contains(ds);
      final isToday = ds == todayStr;
      cells.add(Container(
        decoration: BoxDecoration(
          color: done ? AppColors.accent.withValues(alpha: 0.25) : p.glassMd,
          borderRadius: BorderRadius.circular(6),
          border: isToday
              ? Border.all(color: AppColors.accent, width: 1.5)
              : null,
        ),
        alignment: Alignment.center,
        child: Text('$d',
            style: TextStyle(
                fontSize: 9, color: done ? AppColors.accent : p.t3)),
      ));
    }

    return Column(
      children: [
        Text(DateFormat('MMMM yyyy').format(now),
            style: TextStyle(
                fontSize: 13, color: p.t2, fontWeight: FontWeight.w500)),
        const SizedBox(height: 10),
        Row(
          children: headers
              .map((h) => Expanded(
                  child: Center(
                      child: Text(h,
                          style: TextStyle(fontSize: 9, color: p.t3)))))
              .toList(),
        ),
        const SizedBox(height: 6),
        GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
          children: cells,
        ),
      ],
    );
  }

  // ── YEAR ───────────────────────────────────────────────────────────
  Widget _yearGrid(Habit h, GlassPalette p) {
    final today = DateTime.now();
    final cells = <Widget>[];
    for (var i = 363; i >= 0; i--) {
      final d = today.subtract(Duration(days: i));
      final ds = d.toIso8601String().substring(0, 10);
      final done = h.log.contains(ds);
      cells.add(Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          color: done ? AppColors.accent.withValues(alpha: 0.5) : p.glassMd,
          borderRadius: BorderRadius.circular(3),
        ),
      ));
    }
    return Wrap(spacing: 3, runSpacing: 3, children: cells);
  }

  // ── NOTES ──────────────────────────────────────────────────────────
  Widget _notes(AppState state, Habit h, GlassPalette p) {
    const energies = ['depleted', 'low', 'medium', 'high'];
    final todayStr = DateTime.now().toIso8601String().substring(0, 10);
    final yesterdayStr = DateTime.now()
        .subtract(const Duration(days: 1))
        .toIso8601String()
        .substring(0, 10);

    String fmtDate(int ts) {
      final d = DateTime.fromMillisecondsSinceEpoch(ts);
      final ds = d.toIso8601String().substring(0, 10);
      if (ds == todayStr) return 'Today';
      if (ds == yesterdayStr) return 'Yesterday';
      return DateFormat('MMM d, yyyy').format(d);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ENERGY WHEN DONE',
            style: TextStyle(
                fontSize: 11,
                letterSpacing: 0.6,
                color: p.t3,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 7,
          children: energies.map((e) {
            final active = _noteEnergy == e;
            final c = AppColors.energyColor(e);
            return GestureDetector(
              onTap: () => setState(() => _noteEnergy = e),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 13, vertical: 6),
                decoration: BoxDecoration(
                  color: active ? c.withValues(alpha: 0.15) : p.glassMd,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: active ? c : p.glassBorder, width: 1.5),
                ),
                child: Text(e[0].toUpperCase() + e.substring(1),
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: active ? c : p.t2)),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _noteCtrl,
                style: TextStyle(color: p.t1, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Add a note for today…',
                  hintStyle: TextStyle(color: p.t3, fontSize: 13),
                  filled: true,
                  fillColor: p.glassMd,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 13, vertical: 11),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                    borderSide: BorderSide(color: p.glassBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                    borderSide: BorderSide(color: p.glassBorder),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                if (_noteCtrl.text.trim().isEmpty) return;
                state.addNote(h.id, _noteCtrl.text.trim(), _noteEnergy);
                _noteCtrl.clear();
                setState(() => _noteEnergy = null);
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                decoration: BoxDecoration(
                  gradient: AppColors.gemGradient,
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: const Text('Save note',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (h.notes.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: Text('No notes yet. Add one above.',
                  style: TextStyle(color: p.t3, fontSize: 13)),
            ),
          )
        else
          ...h.notes.reversed.map((n) => Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                    border:
                        Border(bottom: BorderSide(color: p.glassBorder))),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(fmtDate(n.ts),
                            style: TextStyle(fontSize: 10, color: p.t3)),
                        if (n.energy != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.energyColor(n.energy!)
                                  .withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(n.energy!,
                                style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color:
                                        AppColors.energyColor(n.energy!))),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(n.text,
                        style:
                            TextStyle(fontSize: 13, height: 1.5, color: p.t1)),
                  ],
                ),
              )),
      ],
    );
  }
}
