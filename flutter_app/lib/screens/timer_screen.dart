import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

/// Fullscreen focus timer with a gradient progress ring — the Flutter
/// equivalent of the .timer-overlay in the web app.
class TimerScreen extends StatefulWidget {
  final int minutes;
  final String task;
  const TimerScreen({super.key, required this.minutes, required this.task});

  @override
  State<TimerScreen> createState() => _TimerScreenState();
}

class _TimerScreenState extends State<TimerScreen> {
  late int _total;
  late int _left;
  bool _running = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _total = widget.minutes * 60;
    _left = _total;
    _start();
  }

  void _start() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!_running) return;
      setState(() => _left--);
      if (_left <= 0) {
        _timer?.cancel();
        HapticFeedback.heavyImpact();
        setState(() => _running = false);
      }
    });
  }

  void _togglePause() {
    setState(() => _running = !_running);
  }

  void _reset() {
    setState(() {
      _left = _total;
      _running = true;
    });
    _start();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _display {
    if (_left <= 0) return 'Done!';
    final m = _left ~/ 60;
    final s = _left % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final p = GlassPalette.of(Theme.of(context).brightness);
    final ratio = _total > 0 ? _left / _total : 0.0;

    return Scaffold(
      backgroundColor: p.bg.withOpacity(0.96),
      body: GlassBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  widget.task.length > 110
                      ? '${widget.task.substring(0, 110)}…'
                      : widget.task,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: p.t2, fontSize: 14, height: 1.6),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: 240,
                  height: 240,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CustomPaint(
                        size: const Size(240, 240),
                        painter: _RingPainter(ratio, p.glassHi),
                      ),
                      Text(_display,
                          style: TextStyle(
                              fontFamily: 'GoogleSansDisplay',
                              fontSize: 52,
                              fontWeight: FontWeight.w500,
                              color: p.t1)),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _circleBtn(
                        _running ? Icons.pause : Icons.play_arrow,
                        _togglePause,
                        p),
                    const SizedBox(width: 20),
                    _circleBtn(Icons.refresh, _reset, p),
                  ],
                ),
                const SizedBox(height: 24),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 10),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                      border: Border.all(color: p.glassBorder),
                    ),
                    child: Text('Done',
                        style: TextStyle(color: p.t3, fontSize: 15)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap, GlassPalette p) =>
      GestureDetector(
        onTap: onTap,
        child: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: p.glassMd,
            shape: BoxShape.circle,
            border: Border.all(color: p.glassBorder),
          ),
          child: Icon(icon, color: p.t1, size: 24),
        ),
      );
}

class _RingPainter extends CustomPainter {
  final double ratio; // 1.0 = full
  final Color bgColor;
  _RingPainter(this.ratio, this.bgColor);

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.width / 2 - 8;

    final bg = Paint()
      ..color = bgColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8;
    canvas.drawCircle(center, radius, bg);

    final prog = Paint()
      ..shader = const LinearGradient(
        colors: [AppColors.accent, AppColors.accent2],
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      2 * pi * ratio,
      false,
      prog,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.ratio != ratio;
}
