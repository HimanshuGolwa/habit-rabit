import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Shared bits for the login/signup screens — logo, labelled field, error box,
/// and the password-strength meter.

class AuthLogo extends StatelessWidget {
  const AuthLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ShaderMask(
          shaderCallback: (b) => AppColors.gemGradient.createShader(b),
          child: const Icon(Icons.pets, size: 56, color: Colors.white),
        ),
        const SizedBox(height: 12),
        ShaderMask(
          shaderCallback: (b) => AppColors.gemGradient.createShader(b),
          child: const Text('Habit Rabit',
              style: TextStyle(
                  fontFamily: 'GoogleSansDisplay',
                  fontSize: 22,
                  fontWeight: FontWeight.w500,
                  color: Colors.white)),
        ),
      ],
    );
  }
}

class AuthField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final bool obscure;
  final TextInputType? keyboardType;
  final IconData? icon;
  final Widget? trailing;
  final ValueChanged<String>? onChanged;

  const AuthField({
    super.key,
    required this.controller,
    required this.label,
    required this.hint,
    this.obscure = false,
    this.keyboardType,
    this.icon,
    this.trailing,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final p = GlassPalette.of(Theme.of(context).brightness);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(),
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                letterSpacing: 0.5,
                color: p.t3)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: TextStyle(color: p.t1, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: p.t3, fontSize: 15),
            filled: true,
            fillColor: p.glassMd,
            prefixIcon: icon != null ? Icon(icon, size: 18, color: p.t3) : null,
            suffixIcon: trailing,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
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
          ),
        ),
      ],
    );
  }
}

class AuthError extends StatelessWidget {
  final String message;
  const AuthError(this.message, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.danger.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.25)),
      ),
      child: Text(message,
          style: const TextStyle(
              color: AppColors.danger, fontSize: 13, height: 1.5)),
    );
  }
}

/// 4-bar password strength meter (length, uppercase, digit, symbol).
class PasswordStrength extends StatelessWidget {
  final String value;
  const PasswordStrength({super.key, required this.value});

  int get _score {
    var s = 0;
    if (value.length >= 8) s++;
    if (RegExp(r'[A-Z]').hasMatch(value)) s++;
    if (RegExp(r'[0-9]').hasMatch(value)) s++;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(value)) s++;
    return s;
  }

  @override
  Widget build(BuildContext context) {
    final p = GlassPalette.of(Theme.of(context).brightness);
    const colors = [
      AppColors.danger,
      Color(0xFFFB923C),
      AppColors.accent2,
      Color(0xFF4ADE80),
    ];
    final score = _score;
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        children: List.generate(4, (i) {
          final filled = i < score;
          return Expanded(
            child: Container(
              height: 3,
              margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
              decoration: BoxDecoration(
                color: filled ? colors[score - 1] : p.glassBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }
}
