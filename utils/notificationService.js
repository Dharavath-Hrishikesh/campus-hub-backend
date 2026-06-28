const { PrismaClient } = require('@prisma/client');
const { getIO } = require('../config/socket');

const prisma = new PrismaClient();

// Persists notification(s) to PostgreSQL, then emits a live event via Socket.io.
// Exactly one of userId / clubId / isGlobal should be provided per call.
const sendNotification = async ({ userId, message, clubId, isGlobal }) => {
  try {
    const io = getIO();

    if (isGlobal) {
      // DB layer: give every user their own persisted copy (individual read state)
      const users = await prisma.user.findMany({ select: { id: true } });
      await prisma.notification.createMany({
        data: users.map((user) => ({ userId: user.id, message })),
      });

      // Live layer: push instantly to everyone currently connected
      io.to('global').emit('new_notification', { message, scope: 'global' });
      return;
    }

    if (clubId) {
      // DB layer: persist one notification per club follower
      const followers = await prisma.clubFollow.findMany({
        where: { clubId: Number(clubId) },
        select: { userId: true },
      });
      await prisma.notification.createMany({
        data: followers.map((follow) => ({ userId: follow.userId, message })),
      });

      // Live layer: push only to sockets that joined this club's room
      io.to(`club_${clubId}`).emit('new_notification', { message, scope: 'club', clubId });
      return;
    }

    if (userId) {
      // DB layer: persist for this single user
      await prisma.notification.create({ data: { userId, message } });

      // Live layer: push only to that user's personal room
      io.to(`user_${userId}`).emit('new_notification', { message, scope: 'user' });
      return;
    }

    throw new Error('sendNotification requires userId, clubId, or isGlobal');
  } catch (error) {
    console.error('Failed to send notification:', error.message);
  }
};

module.exports = { sendNotification };