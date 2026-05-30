const { verifyAccess } = require('../config/jwt');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccess(token);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Access token expired or invalid.' });
  }
};
