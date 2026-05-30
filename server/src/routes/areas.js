const express     = require('express');
const router      = express.Router();
const pool        = require('../config/db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// ── GET /api/areas ───────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, label, icon, context, created_at FROM areas WHERE user_id=$1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// ── POST /api/areas ──────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { id, label, icon = '', context = '' } = req.body;
    if (!id || !label) return res.status(400).json({ error: 'id and label are required.' });

    const { rows } = await pool.query(
      `INSERT INTO areas (id, user_id, label, icon, context)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id, user_id) DO UPDATE SET label=$3, icon=$4, context=$5
       RETURNING id, label, icon, context, created_at`,
      [id, req.userId, label, icon, context]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /api/areas/:id ────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM areas WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
