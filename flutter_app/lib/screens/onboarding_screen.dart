import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  static const _slides = [
    _Slide(
      icon: Icons.pets,
      title: 'Meet Habit Rabit',
      sub:
          'Your daily action coach. Not a to-do list — a decision engine that tells you the best thing to do right now.',
    ),
    _Slide(
      icon: Icons.bolt,
      title: 'Pick your energy',
      sub:
          'Depleted, low, medium, or high — your energy level shapes every recommendation. No forcing yourself through an intense workout when you\'re running on empty.',
    ),
    _Slide(
      icon: Icons.grid_view,
      title: 'Neglected areas',
      sub:
          'Health, work, relationships, learning — pick what\'s been neglected. The AI gives you one clear action with alternatives, tailored to your moment.',
    ),
  ];

  void _next() {
    if (_page < _slides.length - 1) {
      _controller.nextPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    } else {
      context.read<AppState>().completeOnboarding();
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = GlassPalette.of(Theme.of(context).brightness);
    return Scaffold(
      body: GlassBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
            child: Column(
              children: [
                Expanded(
                  child: PageView.builder(
                    controller: _controller,
                    onPageChanged: (i) => setState(() => _page = i),
                    itemCount: _slides.length,
                    itemBuilder: (_, i) {
                      final s = _slides[i];
                      return Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ShaderMask(
                            shaderCallback: (b) =>
                                AppColors.gemGradient.createShader(b),
                            child: Icon(s.icon, size: 80, color: Colors.white),
                          ),
                          const SizedBox(height: 24),
                          Text(s.title,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  fontFamily: 'GoogleSansDisplay',
                                  fontSize: 28,
                                  fontWeight: FontWeight.w500,
                                  color: p.t1)),
                          const SizedBox(height: 16),
                          Text(s.sub,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  fontSize: 15, height: 1.65, color: p.t2)),
                        ],
                      );
                    },
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_slides.length, (i) {
                    final active = i == _page;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: active ? 22 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: active ? AppColors.accent : p.bg2,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 24),
                GradientButton(
                  label: _page == _slides.length - 1 ? "Let's go" : 'Next',
                  onPressed: _next,
                ),
                TextButton(
                  onPressed: () =>
                      context.read<AppState>().completeOnboarding(),
                  child: Text('Skip', style: TextStyle(color: p.t3)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Slide {
  final IconData icon;
  final String title;
  final String sub;
  const _Slide({required this.icon, required this.title, required this.sub});
}
