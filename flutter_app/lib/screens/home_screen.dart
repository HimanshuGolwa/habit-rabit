import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../services/app_state.dart';
import '../services/rec_engine.dart';
import '../models/recommendation.dart';
import '../data/default_areas.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'timer_screen.dart';
import 'add_area_sheet.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _intentionCtrl = TextEditingController();
  RecResult? _rec;
  Recommendation? _shown; // currently displayed (main or chosen alt)
  int _timerMins = 25;
  bool _showPresets = false;
  bool _loading = false;

  static const _energies = ['depleted', 'low', 'medium', 'high'];
  static const _energyIcons = {
    'depleted': Icons.nightlight_outlined,
    'low': Icons.battery_2_bar_outlined,
    'medium': Icons.contrast,
    'high': Icons.bolt_outlined,
  };

  @override
  void dispose() {
    _intentionCtrl.dispose();
    super.dispose();
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 21) return 'Good evening';
    if (h >= 21) return 'Good night';
    return 'Still up?';
  }

  Future<void> _getRec() async {
    final state = context.read<AppState>();
    final engine = context.read<RecEngine>();
    if (!state.canRecommend) return;

    setState(() => _loading = true);
    await Future.delayed(const Duration(milliseconds: 350));

    final wx = state.useWeather ? (state.weather?.cond ?? 'any') : 'any';
    final result = engine.getRec(
      energy: state.selEnergy!,
      area: state.selArea!,
      weatherCond: wx,
    );
    setState(() {
      _rec = result;
      _shown = result.main;
      _timerMins = result.main.minutes;
      _showPresets = false;
      _loading = false;
    });
  }

  void _selectAlt(Recommendation alt) {
    setState(() {
      _shown = alt;
      _timerMins = alt.minutes;
      _showPresets = false;
    });
  }

  String _fmt(int m) {
    if (m >= 60) {
      final h = m ~/ 60;
      final r = m % 60;
      return r > 0 ? '${h}h ${r}m' : '$h hr';
    }
    return '$m min';
  }

  // Smart presets: shorter / recommended / longer
  List<int> _presets(int rec) {
    const snaps = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 120];
    int snap(num n) => snaps.reduce((a, b) =>
        (b - n).abs() < (a - n).abs() ? b : a);
    var lower = snap((rec * 0.5).clamp(1, 999));
    var higher = snap(rec * 1.8);
    if (lower == rec) lower = (rec - 5).clamp(1, 999);
    if (higher == rec) higher = rec + 10;
    return [lower, rec, higher];
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final p = GlassPalette.of(Theme.of(context).brightness);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
      children: [
        _header(state, p),
        const SizedBox(height: 16),
        _intentionBar(state, p),
        const SizedBox(height: 16),
        _summaryCard(state, p),
        const SizedBox(height: 18),
        _sectionLabel('Your energy right now', p),
        _energyGrid(state, p),
        const SizedBox(height: 8),
        _sectionLabel('Neglected area', p),
        _areaGrid(state, p),
        const SizedBox(height: 10),
        _addAreaButton(p),
        const SizedBox(height: 18),
        GradientButton(
          label: state.selEnergy == null
              ? 'Pick your energy first'
              : state.selArea == null
                  ? 'Pick a neglected area'
                  : 'Get my action',
          onPressed: state.canRecommend ? _getRec : null,
        ),
        const SizedBox(height: 16),
        if (_rec != null || _loading) _recCard(p),
        const SizedBox(height: 18),
        _quote(state, p),
      ],
    );
  }

  // ── HEADER ─────────────────────────────────────────────────────────
  Widget _header(AppState state, GlassPalette p) {
    final now = DateTime.now();
    final time = DateFormat('h:mm').format(now);
    final ampm = DateFormat('a').format(now);
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${_greeting()}, ${state.name.isEmpty ? 'Rabbit' : state.name}',
                    style: TextStyle(color: p.t2, fontSize: 13)),
                const SizedBox(height: 4),
                ShaderMask(
                  shaderCallback: (b) => AppColors.gemGradient.createShader(b),
                  child: Text('What matters right now?',
                      style: TextStyle(
                          fontFamily: 'GoogleSansDisplay',
                          fontSize: 26,
                          fontWeight: FontWeight.w500,
                          color: p.t1,
                          height: 1.15)),
                ),
              ],
            ),
          ),
          if (state.weather != null) ...[
            _chip('${state.weather!.icon} ${state.weather!.temp}°', p),
            const SizedBox(width: 8),
          ],
          Text('$time $ampm', style: TextStyle(color: p.t2, fontSize: 12)),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: state.toggleTheme,
            child: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: p.glassMd,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: p.glassBorder),
              ),
              child: Icon(
                  Theme.of(context).brightness == Brightness.dark
                      ? Icons.light_mode_outlined
                      : Icons.dark_mode_outlined,
                  size: 16,
                  color: p.t2),
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String text, GlassPalette p) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: p.glassMd,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: p.glassBorder),
        ),
        child: Text(text, style: TextStyle(color: p.t2, fontSize: 12)),
      );

  // ── INTENTION ──────────────────────────────────────────────────────
  Widget _intentionBar(AppState state, GlassPalette p) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (state.yesterdayIntention != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 6, left: 2),
            child: Text('Yesterday: "${state.yesterdayIntention}"',
                style: TextStyle(
                    color: p.t3, fontSize: 11, fontStyle: FontStyle.italic)),
          ),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _intentionCtrl,
                style: TextStyle(color: p.t1, fontSize: 13),
                decoration: _inputDecoration(
                    state.todayIntention ?? 'Set your intention for today…', p),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                if (_intentionCtrl.text.trim().isEmpty) return;
                state.saveIntention(_intentionCtrl.text.trim());
                _intentionCtrl.clear();
                FocusScope.of(context).unfocus();
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                    gradient: AppColors.gemGradient,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm)),
                child: const Icon(Icons.check, color: Colors.white, size: 18),
              ),
            ),
          ],
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint, GlassPalette p) =>
      InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: p.t3, fontSize: 13),
        filled: true,
        fillColor: p.glassMd,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusSm),
          borderSide: BorderSide(color: p.glassBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusSm),
          borderSide: BorderSide(color: p.glassBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusSm),
          borderSide: const BorderSide(color: AppColors.accent),
        ),
      );

  // ── SUMMARY ────────────────────────────────────────────────────────
  Widget _summaryCard(AppState state, GlassPalette p) {
    Widget item(String val, String label) => Column(
          children: [
            ShaderMask(
              shaderCallback: (b) => AppColors.gemGradient.createShader(b),
              child: Text(val,
                  style: const TextStyle(
                      fontFamily: 'GoogleSansDisplay',
                      fontSize: 28,
                      fontWeight: FontWeight.w500,
                      color: Colors.white)),
            ),
            const SizedBox(height: 3),
            Text(label.toUpperCase(),
                style: TextStyle(
                    color: p.t3, fontSize: 10, letterSpacing: 0.7)),
          ],
        );
    Widget divider() =>
        Container(width: 1, height: 38, color: p.glassBorder);

    return GlassCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          item('${state.doneToday}', 'done today'),
          divider(),
          item('${state.bestStreakAll}', 'best streak'),
          divider(),
          item('${state.habitCount}', 'habits'),
        ],
      ),
    );
  }

  // ── ENERGY ─────────────────────────────────────────────────────────
  Widget _energyGrid(AppState state, GlassPalette p) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.6,
      children: _energies.map((e) {
        final active = state.selEnergy == e;
        return GlassCard(
          active: active,
          padding: const EdgeInsets.all(8),
          onTap: () => state.setEnergy(e),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(_energyIcons[e], size: 22,
                  color: active ? AppColors.accent : p.t2),
              const SizedBox(height: 6),
              Text(e[0].toUpperCase() + e.substring(1),
                  style: TextStyle(
                      fontSize: 13,
                      color: active ? AppColors.accent : p.t2)),
            ],
          ),
        );
      }).toList(),
    );
  }

  // ── AREAS ──────────────────────────────────────────────────────────
  Widget _areaGrid(AppState state, GlassPalette p) {
    final areas = state.allAreas;
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.0,
      children: areas.map((a) {
        final active = state.selArea == a.id;
        return GlassCard(
          active: active,
          padding: const EdgeInsets.all(6),
          onTap: () => state.pickArea(a.id),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(areaIcon(a.iconKey),
                  size: 26, color: active ? AppColors.accent : p.t2),
              const SizedBox(height: 8),
              Text(a.label,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: active ? AppColors.accent : p.t2)),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _addAreaButton(GlassPalette p) => GestureDetector(
        onTap: () => showAddAreaSheet(context),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
            border: Border.all(
                color: p.glassBorder,
                width: 1.5,
                style: BorderStyle.solid),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add, size: 16, color: p.t3),
              const SizedBox(width: 6),
              Text('Add area', style: TextStyle(color: p.t3, fontSize: 13)),
            ],
          ),
        ),
      );

  // ── REC CARD ───────────────────────────────────────────────────────
  Widget _recCard(GlassPalette p) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('RECOMMENDED ACTION',
                  style: TextStyle(
                      color: p.t3,
                      fontSize: 10,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.w500)),
              GestureDetector(
                onTap: _getRec,
                child: Icon(Icons.refresh, size: 18, color: p.t3),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_loading)
            _shimmer(p)
          else if (_shown != null) ...[
            Text(_shown!.label,
                style: TextStyle(
                    fontFamily: 'GoogleSansDisplay',
                    fontSize: 19,
                    fontWeight: FontWeight.w500,
                    color: p.t1,
                    height: 1.25)),
            const SizedBox(height: 8),
            Text(_shown!.text,
                style: TextStyle(fontSize: 15, height: 1.65, color: p.t2)),
            const SizedBox(height: 16),
            _timerBar(p),
            if (_showPresets) _presetPicker(p),
            if (_rec!.alternatives.isNotEmpty) _alternatives(p),
          ],
        ],
      ),
    );
  }

  Widget _shimmer(GlassPalette p) => Column(
        children: List.generate(3, (i) {
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            height: 14,
            width: [0.88, 0.68, 0.52][i] * 260,
            decoration: BoxDecoration(
                color: p.glassHi, borderRadius: BorderRadius.circular(8)),
          );
        }),
      );

  Widget _timerBar(GlassPalette p) {
    return Container(
      padding: const EdgeInsets.only(top: 14),
      decoration: BoxDecoration(
          border: Border(top: BorderSide(color: p.glassBorder))),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => setState(() => _showPresets = !_showPresets),
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
              decoration: BoxDecoration(
                color: AppColors.accent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.accent.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.schedule, size: 14, color: AppColors.accent),
                  const SizedBox(width: 7),
                  Text(_fmt(_timerMins),
                      style: const TextStyle(
                          color: AppColors.accent,
                          fontSize: 13,
                          fontWeight: FontWeight.w500)),
                  const SizedBox(width: 4),
                  const Icon(Icons.edit, size: 11, color: AppColors.accent),
                ],
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: GradientButton(
              label: 'Start focus',
              icon: Icons.play_arrow,
              padding: const EdgeInsets.symmetric(vertical: 10),
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => TimerScreen(
                    minutes: _timerMins,
                    task: _shown!.text,
                  ),
                ));
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _presetPicker(GlassPalette p) {
    final presets = _presets(_shown!.minutes);
    final tags = ['Shorter', 'Recommended', 'Longer'];
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: p.glassMd,
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        border: Border.all(color: p.glassBorder),
      ),
      child: Row(
        children: List.generate(3, (i) {
          final m = presets[i];
          final active = _timerMins == m;
          final isRec = i == 1;
          return Expanded(
            child: Padding(
              padding: EdgeInsets.only(right: i < 2 ? 6 : 0),
              child: GestureDetector(
                onTap: () => setState(() => _timerMins = m),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 9),
                  decoration: BoxDecoration(
                    color: (active || isRec)
                        ? AppColors.accent.withValues(alpha: 0.12)
                        : p.glass,
                    borderRadius: BorderRadius.circular(11),
                    border: Border.all(
                        color: (active || isRec)
                            ? AppColors.accent
                            : p.glassBorder),
                  ),
                  child: Column(
                    children: [
                      Text(_fmt(m),
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: (active || isRec)
                                  ? AppColors.accent
                                  : p.t2)),
                      Text(tags[i],
                          style: TextStyle(
                              fontSize: 9,
                              color: (active || isRec)
                                  ? AppColors.accent
                                  : p.t3)),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _alternatives(GlassPalette p) {
    return Container(
      margin: const EdgeInsets.only(top: 14),
      padding: const EdgeInsets.only(top: 14),
      decoration: BoxDecoration(
          border: Border(top: BorderSide(color: p.glassBorder))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('OR TRY INSTEAD',
              style: TextStyle(
                  color: p.t3,
                  fontSize: 10,
                  letterSpacing: 1,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 10),
          ..._rec!.alternatives.map((alt) {
            final selected = _shown == alt;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GlassCard(
                active: selected,
                radius: AppTheme.radiusSm,
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 12),
                onTap: () => _selectAlt(alt),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(alt.label,
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: p.t1)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 9, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
                      ),
                      child: Text(_fmt(alt.minutes),
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.accent,
                              fontWeight: FontWeight.w500)),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // ── QUOTE ──────────────────────────────────────────────────────────
  Widget _quote(AppState state, GlassPalette p) => GlassCard(
        child: Text(state.quote,
            style: TextStyle(
                fontSize: 14,
                height: 1.65,
                color: p.t2,
                fontStyle: FontStyle.italic)),
      );

  Widget _sectionLabel(String text, GlassPalette p) => Padding(
        padding: const EdgeInsets.only(bottom: 11, top: 4),
        child: Text(text.toUpperCase(),
            style: TextStyle(
                fontSize: 11,
                letterSpacing: 1.5,
                color: p.t3,
                fontWeight: FontWeight.w500)),
      );
}
