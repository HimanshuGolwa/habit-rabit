import 'package:flutter/material.dart';
import '../models/area.dart';

/// The six built-in neglected areas, mirroring DEFAULT_AREAS in app.js.
/// `iconKey` resolves to an IconData via [areaIcon].
const List<Area> kDefaultAreas = [
  Area(
    id: 'health',
    label: 'Health',
    iconKey: 'health',
    context: 'Physical health, fitness, exercise, nutrition and body care.',
  ),
  Area(
    id: 'work',
    label: 'Work',
    iconKey: 'work',
    context: 'Professional tasks, productivity, career growth and deadlines.',
  ),
  Area(
    id: 'learning',
    label: 'Learning',
    iconKey: 'learning',
    context: 'Studying, reading, skill building and personal development.',
  ),
  Area(
    id: 'relationships',
    label: 'Social',
    iconKey: 'relationships',
    context: 'Friends, family, communication and social connections.',
  ),
  Area(
    id: 'mindfulness',
    label: 'Mind',
    iconKey: 'mindfulness',
    context: 'Mental health, meditation, stress relief and emotional wellbeing.',
  ),
  Area(
    id: 'creativity',
    label: 'Create',
    iconKey: 'creativity',
    context: 'Creative projects, art, writing, music and self-expression.',
  ),
];

/// Monochrome icon for each area — matches the stroke-style SVGs from the
/// web app, themed to currentColor (the icon inherits the card's color).
IconData areaIcon(String key) {
  switch (key) {
    case 'health':
      return Icons.favorite_border;
    case 'work':
      return Icons.work_outline;
    case 'learning':
      return Icons.menu_book_outlined;
    case 'relationships':
      return Icons.people_outline;
    case 'mindfulness':
      return Icons.self_improvement_outlined;
    case 'creativity':
      return Icons.auto_awesome_outlined;
    default:
      return Icons.star_outline; // custom areas
  }
}

/// Icon choices offered when creating a custom area.
const List<IconData> kCustomAreaIcons = [
  Icons.track_changes,
  Icons.bolt_outlined,
  Icons.lightbulb_outline,
  Icons.spa_outlined,
  Icons.star_outline,
  Icons.rocket_launch_outlined,
  Icons.code,
  Icons.music_note_outlined,
  Icons.fitness_center_outlined,
  Icons.edit_outlined,
  Icons.public,
  Icons.camera_alt_outlined,
  Icons.schedule,
  Icons.add_circle_outline,
];
