import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// A frosted "liquid glass" surface — BackdropFilter blur + translucent fill +
/// a hairline border and a top specular highlight. This is the Flutter
/// equivalent of the CSS `backdrop-filter: blur()` glass cards.
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final double blur;
  final VoidCallback? onTap;
  final bool active; // accent-tinted state (selected)
  final Color? tint;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.radius = AppTheme.radius,
    this.blur = 20,
    this.onTap,
    this.active = false,
    this.tint,
  });

  @override
  Widget build(BuildContext context) {
    final p = GlassPalette.of(Theme.of(context).brightness);
    final fill = active
        ? AppColors.accent.withValues(alpha: 0.10)
        : (tint ?? p.glass);
    final border = active ? AppColors.accent : p.glassBorder;

    final card = ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: fill,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: border, width: active ? 1.4 : 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 
                    Theme.of(context).brightness == Brightness.dark ? 0.4 : 0.12),
                blurRadius: 28,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          // Top specular highlight (inset 0 1px 0 shine)
          foregroundDecoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            border: Border(
              top: BorderSide(color: p.glassShine.withValues(alpha: 0.5), width: 1),
            ),
          ),
          child: child,
        ),
      ),
    );

    if (onTap == null) return card;
    return GestureDetector(onTap: onTap, child: card);
  }
}

/// Gradient-filled pill button (the gem-gradient primary action).
class GradientButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final EdgeInsetsGeometry padding;

  const GradientButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.padding = const EdgeInsets.symmetric(vertical: 17),
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return Opacity(
      opacity: enabled ? 1 : 0.35,
      child: GestureDetector(
        onTap: onPressed,
        child: Container(
          width: double.infinity,
          padding: padding,
          decoration: BoxDecoration(
            gradient: AppColors.gemGradient,
            borderRadius: BorderRadius.circular(AppTheme.radius),
            boxShadow: enabled
                ? [
                    BoxShadow(
                      color: AppColors.accent.withValues(alpha: 0.35),
                      blurRadius: 24,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, color: Colors.white, size: 18),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The full-screen gradient-blob background that gives the glass something to
/// blur (the CSS .app::before radial gradients).
class GlassBackground extends StatelessWidget {
  final Widget child;
  const GlassBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final p = GlassPalette.of(Theme.of(context).brightness);
    return Container(
      color: p.bg,
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(-0.7, -0.85),
                  radius: 1.1,
                  colors: [
                    AppColors.accent.withValues(alpha: 0.18),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0.8, 0.6),
                  radius: 1.0,
                  colors: [
                    AppColors.accent2.withValues(alpha: 0.14),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}
