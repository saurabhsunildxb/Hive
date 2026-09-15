const jwt = require('jsonwebtoken');

/**
 * Authentication middleware.
 *
 * Expects: Authorization: Bearer <token>
 *
 * On success, attaches { id: userId } to req.user and calls next().
 * On failure, returns a 401 JSON response.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Authorization header missing.' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Malformed authorization header.' });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token missing.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

module.exports = authMiddleware;
