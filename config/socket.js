const { Server } = require('socket.io');

let io;

// Initializes the Socket.io server and wires up connection/room handling
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Every connected client receives campus-wide global notices
    socket.join('global');

    // Client identifies itself so we can target it directly (personal notifications)
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
    });

    // Client joins a room for each club it follows (club-specific notices/events)
    socket.on('join_club_room', (clubId) => {
      socket.join(`club_${clubId}`);
    });

    socket.on('leave_club_room', (clubId) => {
      socket.leave(`club_${clubId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Lets other modules (e.g. notificationService) access the active io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };