const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendNotification } = require('../utils/notificationService');

// @desc   Create a notice (global if clubId is omitted, club-specific if provided)
// @route  POST /api/notices
exports.createNotice = async (req, res) => {
  try {
    const { title, content, clubId } = req.body;
    const authorId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    if (clubId) {
      // Club-specific notice: confirm the club exists
      const club = await prisma.club.findUnique({
        where: { id: Number(clubId) },
        include: { admins: { select: { id: true } } },
      });

      if (!club) {
        return res.status(404).json({ message: 'Club not found' });
      }

      // CLUB_ADMINs may only post to clubs they actually administer
      if (req.user.role === 'CLUB_ADMIN') {
        const isClubAdmin = club.admins.some((admin) => admin.id === req.user.id);
        if (!isClubAdmin) {
          return res.status(403).json({ message: 'You are not an admin of this club' });
        }
      }
      // SUPER_ADMIN may post to any club, no extra check needed
    } else {
      // Global notice (no clubId): restricted to SUPER_ADMIN only
      if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only a Super Admin can post a global notice' });
      }
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        clubId: clubId ? Number(clubId) : null,
        authorId,
      },
      include: {
        club: true,
        author: { select: { id: true, name: true, role: true } },
      },
    });
    // Push the notice through the dual-layer engine
    if (clubId) {
      await sendNotification({
        clubId: Number(clubId),
        message: `New notice from ${club.name}: ${title}`,
      });
    } else {
      await sendNotification({
        isGlobal: true,
        message: `New campus-wide notice: ${title}`,
      });
    }

    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create notice', error: error.message });
  }
};

// @desc   Get all notices (optionally filtered by ?clubId=)
// @route  GET /api/notices
exports.getAllNotices = async (req, res) => {
  try {
    const { clubId } = req.query;

    const notices = await prisma.notice.findMany({
      where: clubId ? { clubId: Number(clubId) } : undefined,
      include: {
        club: true,
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notices', error: error.message });
  }
};