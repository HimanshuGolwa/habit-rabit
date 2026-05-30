# Habit Rabit 🐇

> The best thing you can do, right now.

A personal action coach that tells you the single best action to take based on your energy level, life area, time of day, and weather.

## Project Structure

```
habit-rabit/
├── index.html          # Main HTML shell
├── css/
│   └── styles.css      # All styles and theming
├── js/
│   ├── app.js          # Core state, routing, clock, weather, onboarding
│   ├── ai.js           # Claude API integration & prompt building
│   ├── habits.js       # Habit tracking, detail sheet, heatmaps, notes
│   ├── timer.js        # Focus timer with circular progress ring
│   └── profile.js      # Settings, preferences, data export
└── assets/
    └── icon.svg        # App icon (PWA + home screen)
```

## Phases Completed

- **Phase 1** — Home tab: energy selector, life area grid, AI recommendations (weather + time aware), focus timer, rotating quotes, custom areas with context
- **Phase 2** — Habits tab: streak tracking, weekly dots, month calendar heatmap, year grid, per-habit notes
- **Phase 3** — Profile tab: name, preferences, reminder toggle, theme, data export, login placeholder
- **Phase 4** — Daily intention field, summary card (done today / best streak / habits count), onboarding flow

## Upcoming

- **Phase 5** — PWA push notifications, data export as JSON backup
- **Phase 6** — Login / signup, cross-device sync

## Setup

Open `index.html` in a browser. No build step required — pure HTML/CSS/JS.

For AI recommendations, the app calls the Anthropic Claude API directly. Make sure your API key is configured or the app is served via a proxy that handles authentication.

## Install as PWA

In Chrome or Safari on mobile: open the app → Share → Add to Home Screen.
