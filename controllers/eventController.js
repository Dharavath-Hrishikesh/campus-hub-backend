const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc   Create a new event for a club (CLUB_ADMIN or SUPER_ADMIN)
// @route  POST /api/events
exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, startTime, endTime, clubId } = req.body;
    const creatorId = req.user.id;

    if (!title || !startTime || !clubId) {
      return res.status(400).json({ message: 'Title, startTime, and clubId are required' });
    }

    const club = await prisma.club.findUnique({
      where: { id: Number(clubId) },
      include: { admins: { select: { id: true } } },
    });

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // CLUB_ADMINs may only create events for clubs they actually administer
    if (req.user.role === 'CLUB_ADMIN') {
      const isClubAdmin = club.admins.some((admin) => admin.id === req.user.id);
      if (!isClubAdmin) {
        return res.status(403).json({ message: 'You are not an admin of this club' });
      }
    }
    // SUPER_ADMIN may create events for any club, no extra check needed

    const event = await prisma.event.create({
      data: {
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        clubId: Number(clubId),
        creatorId,
      },
      include: {
        club: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

// @desc   Get all events, with club name and RSVP count
// @route  GET /api/events
exports.getAllEvents = async (req, res) => {
  try {
    const { clubId } = req.query;

    const events = await prisma.event.findMany({
      where: clubId ? { clubId: Number(clubId) } : undefined,
      include: {
        club: { select: { id: true, name: true } },
        _count: { select: { rsvps: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// @desc   RSVP to an event (creates or updates the user's RSVP status)
// @route  POST /api/events/:id/rsvp
exports.rsvpToEvent = async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;
    const { status } = req.body; // GOING | INTERESTED | NOT_GOING

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        userId_eventId: { userId, eventId }, // composite key from @@unique([userId, eventId])
      },
      update: {
        status: status || 'GOING',
      },
      create: {
        userId,
        eventId,
        status: status || 'GOING',
      },
    });

    res.status(200).json(rsvp);
  } catch (error) {
    res.status(500).json({ message: 'Failed to RSVP to event', error: error.message });
  }
};