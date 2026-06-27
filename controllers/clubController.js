const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc   Create a new club (SUPER_ADMIN only)
// @route  POST /api/clubs
exports.createClub = async (req, res) => {
  try {
    const { name, description, adminIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Club name is required' });
    }

    const existingClub = await prisma.club.findUnique({ where: { name } });
    if (existingClub) {
      return res.status(409).json({ message: 'A club with this name already exists' });
    }

    const club = await prisma.club.create({
      data: {
        name,
        description,
        // Optionally connect existing users as initial club admins
        admins: adminIds?.length ? { connect: adminIds.map((id) => ({ id })) } : undefined,
      },
      include: { admins: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(club);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create club', error: error.message });
  }
};

// @desc   Get all clubs
// @route  GET /api/clubs
exports.getAllClubs = async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        admins: { select: { id: true, name: true, email: true } },
        _count: { select: { followers: true, events: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json(clubs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch clubs', error: error.message });
  }
};

// @desc   Get a single club by ID
// @route  GET /api/clubs/:id
exports.getClubById = async (req, res) => {
  try {
    const { id } = req.params;

    const club = await prisma.club.findUnique({
      where: { id: Number(id) },
      include: {
        admins: { select: { id: true, name: true, email: true } },
        events: true,
        notices: true,
        _count: { select: { followers: true } },
      },
    });

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.status(200).json(club);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch club', error: error.message });
  }
};