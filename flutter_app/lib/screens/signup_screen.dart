import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/app_state.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'auth_widgets.dart';
import 'login_screen.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;
  String _pw = '';

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_password.text != _confirm.text) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      final user = await context.read<AuthService>().signup(
            _name.text.trim(),
            _email.text.trim(),
            _password.text,
          );
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
                    Text('Create account',
                        style: TextStyle(
                            fontFamily: 'GoogleSansDisplay',
                            fontSize: 26,
                            fontWeight: FontWeight.w500,
                            color: p.t1)),
                    const SizedBox(height: 6),
                    Text('Start building habits that stick.',
                        style: TextStyle(color: p.t2, fontSize: 14)),
                    const SizedBox(height: 28),
                    AuthField(
                      controller: _name,
                      label: 'Your name',
                      hint: 'What should we call you?',
                      icon: Icons.person_outline,
                    ),
                    const SizedBox(height: 14),
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
                      hint: 'Min. 8 characters',
                      obscure: _obscure,
                      onChanged: (v) => setState(() => _pw = v),
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
                    PasswordStrength(value: _pw),
                    const SizedBox(height: 14),
                    AuthField(
                      controller: _confirm,
                      label: 'Confirm password',
                      hint: 'Re-enter password',
                      obscure: _obscure,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      AuthError(_error!),
                    ],
                    const SizedBox(height: 20),
                    GradientButton(
                      label: _loading ? 'Please wait…' : 'Create account',
                      onPressed: _loading ? null : _submit,
                    ),
                    const SizedBox(height: 22),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Already have an account? ',
                            style: TextStyle(color: p.t2, fontSize: 14)),
                        GestureDetector(
                          onTap: () => Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const LoginScreen())),
                          child: const Text('Sign in',
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
