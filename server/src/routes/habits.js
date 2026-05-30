const express    = require('express');
const router     = express.Router();
const pool       = require('../config/db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// ── GET /api/habits ──────────────────────────────────
// Returns habits with their full log arrays and notes
router.get('/', async (req, res, next) => {
  try {
    const { rows: habits } = await pool.query(
      'SELECT id, name, icon, area_id, created_at FROM habits WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    if (!habits.length) return res.json([]);

    const habitIds = habits.map(h => h.id);

    const { rows: logs } = await pool.query(
      `SELECT habit_id, log_date::text FROM habit_logs
       WHERE user_id = $1 AND habit_id = ANY($2)`,
      [req.userId, habitIds]
    );

    const { rows: notes } = await pool.query(
      `SELECT id, habit_id, text, energy, created_at FROM habit_notes
       WHERE user_id = $1 AND habit_id = ANY($2) ORDER BY created_at DESC`,
      [req.userId, habitIds]
    );

    const logMap  = {};
    const noteMap = {};
    logs.forEach(l  => { (logMap[l.habit_id]  = logMap[l.habit_id]  || []).push(l.log_date); });
    notes.forEach(n => { (noteMap[n.habit_id] = noteMap[n.habit_id] || []).push(n); });

    const result = habits.map(h => ({
      ...h,
      log:   logMap[h.id]  || [],
      notes: noteMap[h.id] || [],
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// ── POST /api/habits ─────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { id, name, icon = '', area_id = null } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name are required.' });

    const { rows } = await pool.query(
      `INSERT INTO habits (id, user_id, name, icon, area_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id, user_id) DO UPDATE SET name=$3, icon=$4, area_id=$5
       RETURNING id, name, icon, area_id, created_at`,
      [id, req.userId, name, icon, area_id]
    );
    res.status(201).json({ ...rows[0], log: [], notes: [] });
  } catch (err) { next(err); }
});

// ── PUT /api/habits/:id ──────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { name, icon, area_id } = req.body;
    const { rows } = await pool.query(
      `UPDATE habits SET name=COALESCE($1,name), icon=COALESCE($2,icon), area_id=$3
       WHERE id=$4 AND user_id=$5 RETURNING id, name, icon, area_id`,
      [name, icon, area_id, req.params.id, req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Habit not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /api/habits/:id ───────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM habits WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Habit not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
});

// ── POST /api/habits/:id/toggle ──────────────────────
// Body: { date: "YYYY-MM-DD" }  — inserts or deletes the log entry
router.post('/:id/toggle', async (req, res, next) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required.' });

    const exists = await pool.query(
      'SELECT 1 FROM habit_logs WHERE habit_id=$1 AND user_id=$2 AND log_date=$3',
      [req.params.id, req.userId, date]
    );

    if (exists.rows.length) {
      await pool.query(
        'DELETE FROM habit_logs WHERE habit_id=$1 AND user_id=$2 AND log_date=$3',
        [req.params.id, req.userId, date]
      );
      return res.json({ done: false, date });
    } else {
      await pool.query(
        'INSERT INTO habit_logs (habit_id, user_id, log_date) VALUES ($1,$2,$3)',
        [req.params.id, req.userId, date]
      );
      return res.json({ done: true, date });
    }
  } catch (err) { next(err); }
});

// ── GET /api/habits/:id/notes ────────────────────────
router.get('/:id/notes', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, text, energy, created_at FROM habit_notes WHERE habit_id=$1 AND user_id=$2 ORDER BY created_at DESC',
      [req.params.id, req.userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// ── POST /api/habits/:id/notes ───────────────────────
router.post('/:id/notes', async (req, res, next) => {
  try {
    const { text, energy = null } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required.' });

    const { rows } = await pool.query(
      `INSERT INTO habit_notes (habit_id, user_id, text, energy)
       VALUES ($1, $2, $3, $4) RETURNING id, text, energy, created_at`,
      [req.params.id, req.userId, text, energy]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /api/habits/:habitId/notes/:noteId ────────
router.delete('/:habitId/notes/:noteId', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM habit_notes WHERE id=$1 AND habit_id=$2 AND user_id=$3',
      [req.params.noteId, req.params.habitId, req.userId]
    );
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
