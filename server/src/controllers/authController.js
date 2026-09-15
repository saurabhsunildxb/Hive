const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const BCRYPT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns a safe user object (no passwordHash).
 */
function safeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * Issues a signed JWT for a given userId.
 */
function issueToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// POST /api/v1/auth/signup
async function signup(req, res) {
  const { name, email, password } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'A valid email is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    },
  });

  const token = issueToken(user.id);

  return res.status(201).json({
    success: true,
    data: {
      token,
      user: safeUser(user),
    },
  });
}

// POST /api/v1/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  // Validation
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find user — use a generic message to avoid revealing whether email exists
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = issueToken(user.id);

  return res.status(200).json({
    success: true,
    data: {
      token,
      user: safeUser(user),
    },
  });
}

// GET /api/v1/auth/me  (requires authMiddleware)
async function me(req, res) {
  // req.user is set by authMiddleware
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found.' });
  }

  return res.status(200).json({
    success: true,
    data: { user: safeUser(user) },
  });
}

module.exports = { signup, login, me };
