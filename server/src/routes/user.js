const express     = require('express');
const router      = express.Router();
const pool        = require('../config/db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// ── GET /api/user/profile ────────────────────────────
router.get('/profile', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id=$1',
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── PUT /api/user/profile ────────────────────────────
router.put('/profile', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required.' });

    const { rows } = await pool.query(
      'UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2 RETURNING id, name, email',
      [name.trim(), req.userId]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── GET /api/user/prefs ──────────────────────────────
router.get('/prefs', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT use_weather, use_time, remind_enabled, remind_time, def_energy, def_area FROM user_prefs WHERE user_id=$1',
      [req.userId]
    );
    // Return defaults if no prefs row yet
    res.json(rows[0] || {
      use_weather: true, use_time: true,
      remind_enabled: false, remind_time: '08:00',
      def_energy: null, def_area: null
    });
  } catch (err) { next(err); }
});

// ── PUT /api/user/prefs ──────────────────────────────
router.put('/prefs', async (req, res, next) => {
  try {
    const { use_weather, use_time, remind_enabled, remind_time, def_energy, def_area } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO user_prefs (user_id, use_weather, use_time, remind_enabled, remind_time, def_energy, def_area)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id) DO UPDATE SET
         use_weather=$2, use_time=$3, remind_enabled=$4,
         remind_time=$5, def_energy=$6, def_area=$7, updated_at=NOW()
       RETURNING use_weather, use_time, remind_enabled, remind_time, def_energy, def_area`,
      [req.userId, use_weather, use_time, remind_enabled, remind_time, def_energy, def_area]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /api/user ─────────────────────────────────
// Wipes the account completely
router.delete('/', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.userId]);
    res.json({ message: 'Account deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
