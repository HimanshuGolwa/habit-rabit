import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/app_state.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'auth_widgets.dart';
import 'signup_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      final user = await context
          .read<AuthService>()
          .login(_email.text.trim(), _password.text);
      if (mounted) {
        context.read<AppState>().setName(user.name);
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = GlassPalette.of(Theme.of(context).brightness);
    return Scaffold(
      body: GlassBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: GlassCard(
                radius: 28,
                padding: const EdgeInsets.fromLTRB(32, 40, 32, 36),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const AuthLogo(),
                    const SizedBox(height: 28),
                    Text('Welcome back',
                        style: TextStyle(
                            fontFamily: 'GoogleSansDisplay',
                            fontSize: 26,
                            fontWeight: FontWeight.w500,
                            color: p.t1)),
                    const SizedBox(height: 6),
                    Text('Sign in to continue your streak.',
                        style: TextStyle(color: p.t2, fontSize: 14)),
                    const SizedBox(height: 28),
                    AuthField(
                      controller: _email,
                      label: 'Email',
                      hint: 'you@example.com',
                      keyboardType: TextInputType.emailAddress,
                      icon: Icons.mail_outline,
                    ),
                    const SizedBox(height: 14),
                    AuthField(
                      controller: _password,
                      label: 'Password',
                      hint: '••••••••',
                      obscure: _obscure,
                      trailing: IconButton(
                        icon: Icon(
                            _obscure
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            size: 18,
                            color: p.t3),
                        onPressed: () =>
                            setState(() => _obscure = !_obscure),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      AuthError(_error!),
                    ],
                    const SizedBox(height: 20),
                    GradientButton(
                      label: _loading ? 'Please wait…' : 'Sign in',
                      onPressed: _loading ? null : _submit,
                    ),
                    const SizedBox(height: 22),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text("Don't have an account? ",
                            style: TextStyle(color: p.t2, fontSize: 14)),
                        GestureDetector(
                          onTap: () => Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const SignupScreen())),
                          child: const Text('Sign up',
                              style: TextStyle(
                                  color: AppColors.accent,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
