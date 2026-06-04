import 'dart:math';
import 'package:flutter/material.dart';

import '../models/area.dart';
import '../models/habit.dart';
import '../models/note.dart';
import '../data/default_areas.dart';
import '../data/quotes.dart';
import 'storage_service.dart';
import 'weather_service.dart';

/// Central app state — mirrors the global state and persistence logic from
/// app.js / habits.js. Backed by [StorageService] (SharedPreferences).
class AppState extends ChangeNotifier {
  final StorageService store;

  AppState(this.store) {
    _load();
  }

  // ── Theme ────────────────────────────────────────────────────────
  ThemeMode themeMode = ThemeMode.dark;

  // ── Selections ───────────────────────────────────────────────────
  String? selEnergy;
  String? selArea;

  // ── Data ─────────────────────────────────────────────────────────
  List<Area> customAreas = [];
  List<Habit> habits = [];
  Map<String, String> intentions = {}; // date -> text
  WeatherData? weather;

  // ── Preferences ──────────────────────────────────────────────────
  String name = '';
  bool useWeather = true;
  bool useTime = true;
  bool onboarded = false;

  String quote = kQuotes.first;

  List<Area> get allAreas => [...kDefaultAreas, ...customAreas];

  // ── LOAD ─────────────────────────────────────────────────────────
  void _load() {
    final theme = store.get<String>('theme');
    themeMode = theme == 'light' ? ThemeMode.light : ThemeMode.dark;

    selEnergy = store.get<String>('le');
    selArea = store.get<String>('la');
    onboarded = store.get<bool>('onboarded') ?? false;

    final prefs = store.get<Map<String, dynamic>>('prefs');
    if (prefs != null) {
      name = prefs['name'] as String? ?? '';
      useWeather = prefs['useWeather'] as bool? ?? true;
      useTime = prefs['useTime'] as bool? ?? true;
    }

    final ca = store.get<List>('customAreas');
    if (ca != null) {
      customAreas =
          ca.map((e) => Area.fromJson(e as Map<String, dynamic>)).toList();
    }

    final hs = store.get<List>('habits');
    if (hs != null) {
      habits = hs.map((e) => Habit.fromJson(e as Map<String, dynamic>)).toList();
    }

    final ints = store.get<Map<String, dynamic>>('intentions');
    if (ints != null) {
      intentions = ints.map((k, v) => MapEntry(k, v as String));
    }

    quote = kQuotes[Random().nextInt(kQuotes.length)];

    if (useWeather) _fetchWeather();
  }

  Future<void> _fetchWeather() async {
    weather = await WeatherService.fetch();
    notifyListeners();
  }

  // ── THEME ────────────────────────────────────────────────────────
  void toggleTheme() {
    themeMode =
        themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    store.set('theme', themeMode == ThemeMode.dark ? 'dark' : 'light');
    notifyListeners();
  }

  // ── ENERGY / AREA ────────────────────────────────────────────────
  void setEnergy(String e) {
    selEnergy = e;
    store.set('le', e);
    notifyListeners();
  }

  void pickArea(String id) {
    selArea = id;
    store.set('la', id);
    notifyListeners();
  }

  bool get canRecommend => selEnergy != null && selArea != null;

  // ── CUSTOM AREAS ─────────────────────────────────────────────────
  void addArea(String label, String iconKey, String context) {
    final id = 'custom_${DateTime.now().millisecondsSinceEpoch}';
    customAreas.add(Area(id: id, label: label, iconKey: iconKey, context: context));
    store.set('customAreas', customAreas.map((a) => a.toJson()).toList());
    notifyListeners();
  }

  // ── HABITS ───────────────────────────────────────────────────────
  void _saveHabits() {
    store.set('habits', habits.map((h) => h.toJson()).toList());
  }

  void addHabit(String name, String icon, String? areaId) {
    habits.add(Habit(
      id: 'h_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      icon: icon,
      areaId: areaId,
    ));
    _saveHabits();
    notifyListeners();
  }

  void deleteHabit(String id) {
    habits.removeWhere((h) => h.id == id);
    _saveHabits();
    notifyListeners();
  }

  void toggleDay(String id, String date) {
    final h = habits.firstWhere((h) => h.id == id);
    if (h.log.contains(date)) {
      h.log.remove(date);
    } else {
      h.log.add(date);
    }
    _saveHabits();
    notifyListeners();
  }

  void addNote(String habitId, String text, String? energy) {
    final h = habits.firstWhere((h) => h.id == habitId);
    h.notes.add(HabitNote(
      ts: DateTime.now().millisecondsSinceEpoch,
      text: text,
      energy: energy,
    ));
    _saveHabits();
    notifyListeners();
  }

  // ── SUMMARY ──────────────────────────────────────────────────────
  String get _today => DateTime.now().toIso8601String().substring(0, 10);
  int get doneToday => habits.where((h) => h.log.contains(_today)).length;
  int get bestStreakAll =>
      habits.fold(0, (m, h) => max(m, h.bestStreak));
  int get habitCount => habits.length;

  // ── INTENTIONS ───────────────────────────────────────────────────
  String? get todayIntention => intentions[_today];
  String? get yesterdayIntention {
    final y = DateTime.now()
        .subtract(const Duration(days: 1))
        .toIso8601String()
        .substring(0, 10);
    return intentions[y];
  }

  void saveIntention(String text) {
    intentions[_today] = text;
    store.set('intentions', intentions);
    notifyListeners();
  }

  // ── PREFS ────────────────────────────────────────────────────────
  void _savePrefs() {
    store.set('prefs', {
      'name': name,
      'useWeather': useWeather,
      'useTime': useTime,
    });
  }

  void setName(String v) {
    name = v;
    _savePrefs();
    notifyListeners();
  }

  void setUseWeather(bool v) {
    useWeather = v;
    _savePrefs();
    if (v) _fetchWeather();
    notifyListeners();
  }

  void setUseTime(bool v) {
    useTime = v;
    _savePrefs();
    notifyListeners();
  }

  // ── ONBOARDING ───────────────────────────────────────────────────
  void completeOnboarding() {
    onboarded = true;
    store.set('onboarded', true);
    notifyListeners();
  }

  // ── DATA ─────────────────────────────────────────────────────────
  Future<void> clearAll() async {
    await store.clear();
    customAreas = [];
    habits = [];
    intentions = {};
    selEnergy = null;
    selArea = null;
    name = '';
    onboarded = false;
    notifyListeners();
  }
}
