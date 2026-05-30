const jwt = require('jsonwebtoken');

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL     = process.env.JWT_EXPIRES_IN         || '15m';
const REFRESH_TTL    = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signAccess(userId) {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefresh(userId) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

// Convert TTL string (e.g. "7d") to a JS Date for DB storage
function refreshExpiresAt() {
  const ms = parseTTL(REFRESH_TTL);
  return new Date(Date.now() + ms);
}

function parseTTL(ttl) {
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86400000;
  return parseInt(match[1]) * map[match[2]];
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, refreshExpiresAt };
