const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const env = require('../config/env');
const User = require('../models/User');
const taskService = require('../services/taskService');
const authService = require('../services/authService');

const projectRoom = (projectId) => `project:${projectId}`;

const setupSocketAuth = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, env.jwt.secret);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });
};

const registerHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('project:join', async ({ projectId }) => {
      try {
        await authService.verifyProjectAccess(projectId, socket.user._id);
        socket.join(projectRoom(projectId));
        socket.emit('project:joined', { projectId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('project:leave', ({ projectId }) => {
      socket.leave(projectRoom(projectId));
    });

    socket.on('task:move', async ({ taskId, status, order }) => {
      try {
        const task = await taskService.updateTaskStatus(
          taskId,
          socket.user._id,
          status,
          order
        );

        io.to(projectRoom(task.project)).emit('task:moved', { task });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {});
  });
};

const initSockets = async (server, redisClients) => {
  const { Server } = require('socket.io');

  const io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  if (redisClients) {
    io.adapter(createAdapter(redisClients.pubClient, redisClients.subClient));
  }

  setupSocketAuth(io);
  registerHandlers(io);

  return io;
};

module.exports = { initSockets, projectRoom };
