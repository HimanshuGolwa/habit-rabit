# Habit Rabit — Flutter

The Flutter rewrite of Habit Rabit, targeting **iOS, Android, and web** from a
single codebase. This is a port of the web app in `../` (kept live until
Flutter web is production-ready).

## What's here

```
flutter_app/
├── pubspec.yaml                 # deps: provider, shared_preferences, http, geolocator, intl
├── assets/
│   └── rec_pool.json            # all 500 recommendations (generated from ../js/rec-pool.js)
└── lib/
    ├── main.dart                # app entry, provider wiring, theme
    ├── theme/app_theme.dart     # glass palette (dark/light) + design tokens
    ├── models/                  # Habit, Area, HabitNote, Recommendation
    ├── data/                    # default areas, quotes
    ├── services/
    │   ├── storage_service.dart # SharedPreferences (mirrors the JS `S` helper)
    │   ├── app_state.dart       # ChangeNotifier — all state + persistence
    │   ├── rec_engine.dart      # loads the pool + context-aware selection
    │   ├── weather_service.dart # open-meteo + geolocator
    │   └── auth_service.dart    # JWT auth client for the Express backend
    ├── widgets/glass_card.dart  # liquid-glass surfaces (BackdropFilter)
    └── screens/                 # onboarding, home, habits, profile, timer,
                                 # login, signup, + bottom sheets
```

## Feature parity with the web app

- 4 energy levels (depleted / low / medium / high)
- 6 neglected areas + custom areas with icon picker
- 500-rec context-aware pool — time-of-day + weather sensitive
  (midnight → sleep; rainy + low health → indoor; clear → outdoor)
- One main recommendation (heading + text) + 3 tappable alternatives
- Smart timer presets (shorter / recommended / longer) + custom + fullscreen
  ring countdown
- Habits: weekly dots, streaks, month/year heatmap, energy-tagged notes
- Daily intention, summary card, rotating quotes
- Liquid-glass UI with dark/light theme
- Login / signup with password-strength meter, JWT session, profile account card

## Running it

This repo ships only `lib/`, `assets/`, and `pubspec.yaml`. The platform
folders (`android/`, `ios/`, `web/`) are generated — they're gitignored.

```bash
cd flutter_app

# 1. Generate the platform scaffolding into this existing project
flutter create .

# 2. Install dependencies
flutter pub get

# 3. Run
flutter run -d chrome      # web
flutter run -d <device>    # iOS / Android (with a device/emulator attached)
```

### Backend

`lib/services/auth_service.dart` points at `http://localhost:3000` by default.
Set `AuthService.apiBase` to your deployed Railway URL for production. The auth
endpoints match the Express server in `../server`.

### Fonts (optional)

To match the web app's typography exactly, drop Google Sans and Google Sans
Display `.ttf` files into `assets/fonts/` and uncomment the `fonts:` block in
`pubspec.yaml`. Without them the app uses the platform default font.

### Regenerating the rec pool

The pool is generated from the canonical JS source:

```bash
node -e "const fs=require('fs');eval(fs.readFileSync('../js/rec-pool.js','utf8').replace('const REC_POOL','global.REC_POOL'));fs.writeFileSync('assets/rec_pool.json',JSON.stringify(REC_POOL))"
```

## Next steps

- [ ] Wire `rec_engine.dart` to the live Claude API (the pool is the fallback)
- [ ] Push habits/notes/areas to the backend instead of local-only storage
- [ ] Add platform-specific permission config (location for weather)
- [ ] App Store + Play Store build pipelines
