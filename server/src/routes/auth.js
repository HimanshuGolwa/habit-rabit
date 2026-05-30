const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();
const pool     = require('../config/db');
const { signAccess, signRefresh, verifyRefresh, refreshExpiresAt } = require('../config/jwt');

// ── POST /api/auth/signup ────────────────────────────
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, name, email, created_at`,
      [name.trim(), email.toLowerCase(), hash]
    );
    const user = result.rows[0];

    // Create default prefs row
    await pool.query('INSERT INTO user_prefs (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);

    const accessToken  = signAccess(user.id);
    const refreshToken = signRefresh(user.id);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshExpiresAt()]
    );

    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken });
  } catch (err) { next(err); }
});

// ── POST /api/auth/login ─────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const accessToken  = signAccess(user.id);
    const refreshToken = signRefresh(user.id);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshExpiresAt()]
    );

    res.json({ user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken });
  } catch (err) { next(err); }
});

// ── POST /api/auth/refresh ───────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required.' });

    // Verify signature first
    let payload;
    try { payload = verifyRefresh(refreshToken); }
    catch { return res.status(401).json({ error: 'Invalid or expired refresh token.' }); }

    // Check it exists in DB (not revoked)
    const row = await pool.query(
      'SELECT id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    if (!row.rows.length) return res.status(401).json({ error: 'Refresh token revoked or expired.' });

    // Rotate: delete old, issue new pair
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    const newAccess  = signAccess(payload.userId);
    const newRefresh = signRefresh(payload.userId);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [payload.userId, newRefresh, refreshExpiresAt()]
    );

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) { next(err); }
});

// ── POST /api/auth/logout ────────────────────────────
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    res.json({ message: 'Logged out.' });
  } catch (err) { next(err); }
});

module.exports = router;
