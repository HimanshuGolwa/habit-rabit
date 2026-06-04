import 'package:flutter/material.dart';

/// Centralised palette + glass design tokens. Mirrors the CSS variables
/// from the original web app (styles.css :root / [data-theme="light"]).
class AppColors {
  AppColors._();

  // ── Brand gradient ──────────────────────────────────────────────
  static const accent = Color(0xFFA78BFA);
  static const accent2 = Color(0xFF60A5FA);
  static const danger = Color(0xFFF87171);

  static const gemGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accent, accent2],
  );

  // ── Energy colors ───────────────────────────────────────────────
  static const energyDepleted = Color(0xFF818CF8);
  static const energyLow = Color(0xFF60A5FA);
  static const energyMedium = Color(0xFFA78BFA);
  static const energyHigh = Color(0xFFFB923C);

  static Color energyColor(String e) {
    switch (e) {
      case 'depleted':
        return energyDepleted;
      case 'low':
        return energyLow;
      case 'medium':
        return energyMedium;
      case 'high':
        return energyHigh;
      default:
        return accent;
    }
  }
}

/// Resolved colors for a given brightness — the values switch the way the
/// CSS custom properties did between dark and light themes.
class GlassPalette {
  final Color bg;
  final Color bg2;
  final Color t1;
  final Color t2;
  final Color t3;
  final Color glass;
  final Color glassMd;
  final Color glassHi;
  final Color glassBorder;
  final Color glassShine;

  const GlassPalette({
    required this.bg,
    required this.bg2,
    required this.t1,
    required this.t2,
    required this.t3,
    required this.glass,
    required this.glassMd,
    required this.glassHi,
    required this.glassBorder,
    required this.glassShine,
  });

  static const dark = GlassPalette(
    bg: Color(0xFF08080F),
    bg2: Color(0xFF111119),
    t1: Color(0xFFEEEEF4),
    t2: Color(0xFF9898B0),
    t3: Color(0xFF55556A),
    glass: Color(0x0AFFFFFF), // rgba(255,255,255,0.04)
    glassMd: Color(0x0FFFFFFF), // 0.06
    glassHi: Color(0x17FFFFFF), // 0.09
    glassBorder: Color(0x17FFFFFF), // 0.09
    glassShine: Color(0x21FFFFFF), // 0.13
  );

  static const light = GlassPalette(
    bg: Color(0xFFDDDDE8),
    bg2: Color(0xFFF4F4F8),
    t1: Color(0xFF111122),
    t2: Color(0xFF44445A),
    t3: Color(0xFF88889A),
    glass: Color(0x8CFFFFFF), // ~0.55
    glassMd: Color(0xA6FFFFFF), // ~0.65
    glassHi: Color(0xCCFFFFFF), // ~0.8
    glassBorder: Color(0xBFFFFFFF), // ~0.75
    glassShine: Color(0xF2FFFFFF), // ~0.95
  );

  static GlassPalette of(Brightness b) =>
      b == Brightness.dark ? dark : light;
}

class AppTheme {
  static const double radius = 20;
  static const double radiusSm = 13;

  static ThemeData build(Brightness brightness) {
    final p = GlassPalette.of(brightness);
    return ThemeData(
      brightness: brightness,
      scaffoldBackgroundColor: p.bg,
      fontFamily: 'GoogleSans',
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.accent,
        brightness: brightness,
      ).copyWith(
        primary: AppColors.accent,
        surface: p.bg,
      ),
      useMaterial3: true,
    );
  }
}
