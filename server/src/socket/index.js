const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

/**
 * Socket.IO foundation.
 *
 * Transport only — no rooms, presence, or domain events.
 * JWT verification uses the same secret and payload shape as REST auth.
 */

function extractToken(socket) {
  const raw = socket.handshake?.auth?.token;

  if (raw == null || raw === '') {
    return { error: 'Token missing.' };
  }

  if (typeof raw !== 'string') {
    return { error: 'Malformed token.' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: 'Token missing.' };
  }

  if (trimmed.startsWith('Bearer ')) {
    const inner = trimmed.slice(7).trim();
    if (!inner) {
      return { error: 'Token missing.' };
    }
    return { token: inner };
  }

  return { token: trimmed };
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    const extracted = extractToken(socket);
    if (extracted.error) {
      return next(new Error(extracted.error));
    }

    try {
      const payload = jwt.verify(extracted.token, process.env.JWT_SECRET);
      if (!payload || !payload.userId) {
        return next(new Error('Invalid token.'));
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return next(new Error('Invalid token.'));
      }

      socket.user = user;
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Token has expired.'));
      }
      return next(new Error('Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      // Connection lifecycle only. Domain events are added in a later phase.
    });
  });

  return io;
}

module.exports = { initSocket };
