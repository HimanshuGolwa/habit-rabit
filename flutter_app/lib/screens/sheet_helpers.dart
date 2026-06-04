import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Shared bottom-sheet presentation with the glass aesthetic + a reusable
/// glass text field, used by the add-area / add-habit / detail sheets.
Future<T?> showGlassSheet<T>(
    BuildContext context, WidgetBuilder builder) {
  final p = GlassPalette.of(Theme.of(context).brightness);
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(ctx).viewInsets.bottom,
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: Container(
            width: double.infinity,
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(ctx).size.height * 0.88,
            ),
            decoration: BoxDecoration(
              color: p.bg2,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(28)),
              border: Border.all(color: p.glassBorder),
            ),
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 40),
            child: SingleChildScrollView(child: builder(ctx)),
          ),
        ),
      ),
    ),
  );
}

Widget sheetInput(
  TextEditingController ctrl,
  String hint,
  GlassPalette p, {
  int maxLines = 1,
}) {
  return TextField(
    controller: ctrl,
    maxLines: maxLines,
    style: TextStyle(color: p.t1, fontSize: 15),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: p.t3, fontSize: 14),
      filled: true,
      fillColor: p.glassMd,
      contentPadding: const EdgeInsets.all(13),
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
  );
}
