import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/app_state.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'login_screen.dart';
import 'signup_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _nameCtrl.text = context.read<AppState>().name;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final auth = context.read<AuthService>();
    final p = GlassPalette.of(Theme.of(context).brightness);

    final totalDays = state.habits
        .expand((h) => h.log)
        .toSet()
        .length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
      children: [
        _sectionTitle('Your stats', p),
        Row(
          children: [
            _stat('${state.habitCount}', 'Habits', p),
            const SizedBox(width: 10),
            _stat('${state.bestStreakAll}', 'Best streak', p),
            const SizedBox(width: 10),
            _stat('$totalDays', 'Days active', p),
          ],
        ),
        const SizedBox(height: 22),
        _sectionTitle('Your name', p),
        TextField(
          controller: _nameCtrl,
          style: TextStyle(color: p.t1, fontSize: 14),
          decoration: _dec('What should we call you?', p),
        ),
        const SizedBox(height: 10),
        GradientButton(
          label: 'Save name',
          padding: const EdgeInsets.symmetric(vertical: 12),
          onPressed: () {
            state.setName(_nameCtrl.text.trim());
            FocusScope.of(context).unfocus();
          },
        ),
        const SizedBox(height: 22),
        _sectionTitle('Preferences', p),
        _toggleRow('Use weather data',
            'Tailor recommendations to current conditions',
            state.useWeather, state.setUseWeather, p),
        _toggleRow('Time-aware recommendations',
            'Avoid intense tasks late at night', state.useTime,
            state.setUseTime, p),
        const SizedBox(height: 22),
        _sectionTitle('Appearance', p),
        _toggleRow('Dark mode', '', state.themeMode == ThemeMode.dark,
            (_) => state.toggleTheme(), p),
        const SizedBox(height: 22),
        _sectionTitle('Account', p),
        _accountSection(state, auth, p),
        const SizedBox(height: 22),
        _sectionTitle('Data', p),
        GestureDetector(
          onTap: () => _confirmClear(state),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
              border: Border.all(color: AppColors.danger),
            ),
            child: const Text('Clear all data',
                style: TextStyle(color: AppColors.danger, fontSize: 14)),
          ),
        ),
        const SizedBox(height: 22),
        _sectionTitle('About', p),
        Text('Habit Rabit · Flutter · v1.0',
            style: TextStyle(color: p.t3, fontSize: 11)),
        const SizedBox(height: 4),
        Text('The best thing you can do, right now.',
            style: TextStyle(color: p.t3, fontSize: 11)),
      ],
    );
  }

  Widget _accountSection(AppState state, AuthService auth, GlassPalette p) {
    final session = auth.session;
    if (session != null) {
      final initials = (session.name.isNotEmpty ? session.name : session.email)
          .trim()
          .split(' ')
          .map((w) => w.isEmpty ? '' : w[0])
          .take(2)
          .join()
          .toUpperCase();
      return GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: const BoxDecoration(
                      gradient: AppColors.gemGradient,
                      shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: Text(initials,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                          fontSize: 16)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(session.name,
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                              color: p.t1)),
                      Text(session.email,
                          style: TextStyle(fontSize: 12, color: p.t3)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () async {
                await auth.logout();
                setState(() {});
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  border: Border.all(color: AppColors.danger),
                ),
                child: const Text('Sign out',
                    style: TextStyle(color: AppColors.danger, fontSize: 14)),
              ),
            ),
          ],
        ),
      );
    }

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sign in to sync your habits and streaks across devices.',
              style: TextStyle(color: p.t2, fontSize: 14, height: 1.55)),
          const SizedBox(height: 14),
          Row(
            children: [
              GestureDetector(
                onTap: () async {
                  await Navigator.push(context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()));
                  setState(() {});
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 22, vertical: 11),
                  decoration: BoxDecoration(
                    gradient: AppColors.gemGradient,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  ),
                  child: const Text('Sign in',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w500)),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: () async {
                  await Navigator.push(context,
                      MaterialPageRoute(builder: (_) => const SignupScreen()));
                  setState(() {});
                },
                child: const Text('Create account',
                    style: TextStyle(
                        color: AppColors.accent,
                        fontSize: 14,
                        fontWeight: FontWeight.w500)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _confirmClear(AppState state) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear ALL data?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              state.clearAll();
              Navigator.pop(ctx);
            },
            child: const Text('Clear',
                style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }

  Widget _stat(String v, String l, GlassPalette p) => Expanded(
        child: GlassCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            children: [
              Text(v,
                  style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w500,
                      color: AppColors.accent)),
              const SizedBox(height: 2),
              Text(l, style: TextStyle(fontSize: 11, color: p.t3)),
            ],
          ),
        ),
      );

  Widget _toggleRow(String label, String sub, bool value,
      ValueChanged<bool> onChanged, GlassPalette p) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: p.glassBorder))),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 14, color: p.t1)),
                if (sub.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child:
                        Text(sub, style: TextStyle(fontSize: 12, color: p.t3)),
                  ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: Colors.white,
            activeTrackColor: AppColors.accent,
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String t, GlassPalette p) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(t.toUpperCase(),
            style: TextStyle(
                fontSize: 11,
                letterSpacing: 1.5,
                color: p.t3,
                fontWeight: FontWeight.w500)),
      );

  InputDecoration _dec(String hint, GlassPalette p) => InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: p.t3, fontSize: 14),
        filled: true,
        fillColor: p.glassMd,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
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
}
