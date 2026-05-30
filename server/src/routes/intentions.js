const express     = require('express');
const router      = express.Router();
const pool        = require('../config/db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// ── GET /api/intentions ──────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT intention_date::text AS date, text FROM intentions
       WHERE user_id=$1 ORDER BY intention_date DESC`,
      [req.userId]
    );
    // Return as { "YYYY-MM-DD": "text" } map — matches the localStorage shape
    const map = {};
    rows.forEach(r => { map[r.date] = r.text; });
    res.json(map);
  } catch (err) { next(err); }
});

// ── POST /api/intentions ─────────────────────────────
// Body: { date: "YYYY-MM-DD", text: "..." }
router.post('/', async (req, res, next) => {
  try {
    const { date, text } = req.body;
    if (!date || !text) return res.status(400).json({ error: 'date and text are required.' });

    await pool.query(
      `INSERT INTO intentions (user_id, intention_date, text)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, intention_date) DO UPDATE SET text=$3`,
      [req.userId, date, text]
    );
    res.json({ date, text });
  } catch (err) { next(err); }
});

module.exports = router;
