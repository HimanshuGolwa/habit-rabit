import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'services/storage_service.dart';
import 'services/app_state.dart';
import 'services/auth_service.dart';
import 'services/rec_engine.dart';
import 'theme/app_theme.dart';
import 'screens/app_shell.dart';
import 'screens/onboarding_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);

  final store = await StorageService.create();
  final recEngine = await RecEngine.load();

  runApp(HabitRabitApp(
    store: store,
    recEngine: recEngine,
  ));
}

class HabitRabitApp extends StatelessWidget {
  final StorageService store;
  final RecEngine recEngine;

  const HabitRabitApp({
    super.key,
    required this.store,
    required this.recEngine,
  });

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState(store)),
        Provider.value(value: recEngine),
        Provider(create: (_) => AuthService(store)),
      ],
      child: Consumer<AppState>(
        builder: (context, state, _) {
          return MaterialApp(
            title: 'Habit Rabit',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.build(Brightness.light),
            darkTheme: AppTheme.build(Brightness.dark),
            themeMode: state.themeMode,
            home: state.onboarded
                ? const AppShell()
                : const OnboardingScreen(),
          );
        },
      ),
    );
  }
}
