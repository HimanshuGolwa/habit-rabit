import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'home_screen.dart';
import 'habits_screen.dart';
import 'profile_screen.dart';

/// Bottom-nav shell hosting the three tabs (Home / Habits / Profile),
/// equivalent to switchTab() + .bot-nav in the web app.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _tabs = [HomeScreen(), HabitsScreen(), ProfileScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: GlassBackground(
        child: SafeArea(
          bottom: false,
          child: IndexedStack(index: _index, children: _tabs),
        ),
      ),
      bottomNavigationBar: _GlassNavBar(
        index: _index,
        onTap: (i) => setState(() => _index = i),
      ),
    );
  }
}

class _GlassNavBar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;
  const _GlassNavBar({required this.index, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = GlassPalette.of(Theme.of(context).brightness);
    final items = [
      (_NavItem(Icons.home_outlined, 'Home')),
      (_NavItem(Icons.check_box_outlined, 'Habits')),
      (_NavItem(Icons.person_outline, 'Profile')),
    ];

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
        child: Container(
          decoration: BoxDecoration(
            color: p.bg.withOpacity(0.8),
            border: Border(top: BorderSide(color: p.glassBorder)),
          ),
          padding: EdgeInsets.only(
            top: 8,
            bottom: 8 + MediaQuery.of(context).padding.bottom,
          ),
          child: Row(
            children: List.generate(items.length, (i) {
              final selected = i == index;
              final color = selected ? AppColors.accent : p.t3;
              return Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onTap(i),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(items[i].icon, color: color, size: 22),
                      const SizedBox(height: 4),
                      Text(items[i].label,
                          style: TextStyle(
                              color: color,
                              fontSize: 11,
                              fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  _NavItem(this.icon, this.label);
}
