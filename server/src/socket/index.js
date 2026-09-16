const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

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

function userRoom(userId) {
  return `user:${userId}`;
}

function workspaceRoom(workspaceId) {
  return `workspace:${workspaceId}`;
}

function projectRoom(projectId) {
  return `project:${projectId}`;
}

function acknowledge(ack, result) {
  if (typeof ack === 'function') {
    ack(result);
  }
}

async function isWorkspaceMember(userId, workspaceId) {
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(membership);
}

async function canAccessProject(userId, projectId) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      workspaceId: true,
    },
  });

  if (!project) {
    return {
      allowed: false,
      error: 'Project not found.',
    };
  }

  const member = await isWorkspaceMember(userId, project.workspaceId);

  if (!member) {
    return {
      allowed: false,
      error: 'Access denied.',
    };
  }

  return {
    allowed: true,
    workspaceId: project.workspaceId,
  };
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
      const payload = jwt.verify(
        extracted.token,
        process.env.JWT_SECRET
      );

      if (!payload || !payload.userId) {
        return next(new Error('Invalid token.'));
      }

      const user = await prisma.user.findUnique({
        where: {
          id: payload.userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
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
    // Automatically join the user's personal room
    socket.join(userRoom(socket.user.id));

    socket.on('workspace:join', async (workspaceId, ack) => {
      try {
        if (!workspaceId || typeof workspaceId !== 'string') {
          return acknowledge(ack, {
            success: false,
            error: 'Workspace ID is required.',
          });
        }

        const isMember = await isWorkspaceMember(
          socket.user.id,
          workspaceId
        );

        if (!isMember) {
          return acknowledge(ack, {
            success: false,
            error: 'Access denied.',
          });
        }

        const room = workspaceRoom(workspaceId);

        socket.join(room);
        

        return acknowledge(ack, {
          success: true,
          room,
        });
      } catch (err) {
        console.error('[Socket Workspace Join Error]', err);

        return acknowledge(ack, {
          success: false,
          error: 'Failed to join workspace.',
        });
      }
    });

    socket.on('workspace:leave', (workspaceId, ack) => {
      if (!workspaceId || typeof workspaceId !== 'string') {
        return acknowledge(ack, {
          success: false,
          error: 'Workspace ID is required.',
        });
      }

      socket.leave(workspaceRoom(workspaceId));
      

      return acknowledge(ack, {
        success: true,
      });
    });

    socket.on('project:join', async (projectId, ack) => {
      try {
        if (!projectId || typeof projectId !== 'string') {
          return acknowledge(ack, {
            success: false,
            error: 'Project ID is required.',
          });
        }

        const access = await canAccessProject(
          socket.user.id,
          projectId
        );

        if (!access.allowed) {
          return acknowledge(ack, {
            success: false,
            error: access.error,
          });
        }

        const room = projectRoom(projectId);

        socket.join(room);
        

        return acknowledge(ack, {
          success: true,
          room,
        });
      } catch (err) {
        console.error('[Socket Project Join Error]', err);

        return acknowledge(ack, {
          success: false,
          error: 'Failed to join project.',
        });
      }
    });

    socket.on('project:leave', (projectId, ack) => {
      if (!projectId || typeof projectId !== 'string') {
        return acknowledge(ack, {
          success: false,
          error: 'Project ID is required.',
        });
      }

      socket.leave(projectRoom(projectId));
      

      return acknowledge(ack, {
        success: true,
      });
    });

    socket.on('disconnect', () => {
      // Socket.IO automatically removes the socket from all rooms.
    });
  });

  return io;
}

module.exports = { initSocket, workspaceRoom, projectRoom, userRoom };