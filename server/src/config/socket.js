const { Server } = require('socket.io');
const { clientUrl } = require('./env');

let io;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: clientUrl, methods: ['GET', 'POST'], credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('subscribe:execution', (executionId) => {
      socket.join(`execution:${executionId}`);
    });
    socket.on('unsubscribe:execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
    });
    socket.on('subscribe:user', (userId) => {
      socket.join(`user:${userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

const emit = (room, event, data) => {
  try { getIO().to(room).emit(event, data); } catch (_) {}
};

module.exports = { init, getIO, emit };
