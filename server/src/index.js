require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const authRoutes       = require('./routes/auth');
const habitRoutes      = require('./routes/habits');
const areaRoutes       = require('./routes/areas');
const intentionRoutes  = require('./routes/intentions');
const userRoutes       = require('./routes/user');
const errorHandler     = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── SECURITY ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));

// ── RATE LIMITING ────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
});

// ── ROUTES ───────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/habits',     apiLimiter,  habitRoutes);
app.use('/api/areas',      apiLimiter,  areaRoutes);
app.use('/api/intentions', apiLimiter,  intentionRoutes);
app.use('/api/user',       apiLimiter,  userRoutes);

// ── HEALTH CHECK ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── ERROR HANDLER ─────────────────────────────────────
app.use(errorHandler);

// ── START ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Habit Rabit API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
