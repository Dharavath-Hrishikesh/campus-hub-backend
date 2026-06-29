const { PrismaClient } = require('@prisma/client');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

const prisma = new PrismaClient();

// Helper: pipes a memory buffer to Cloudinary and resolves with the upload result
const uploadBufferToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'campus-hub/lost-items' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// @desc   Report a lost/found item (image optional)
// @route  POST /api/lost-items
exports.createLostItem = async (req, res) => {
  try {
    const { itemName, description, location, status } = req.body;
    const reportedById = req.user.id;

    if (!itemName) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    let imageUrl = null;

    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const lostItem = await prisma.lostItem.create({
      data: {
        itemName,
        description,
        location,
        status: status || 'LOST',
        imageUrl,
        reportedById,
      },
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(lostItem);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create lost item', error: error.message });
  }
};

// @desc   Get all lost/found items, optionally filtered by location and/or status
// @route  GET /api/lost-items?location=&status=
exports.getAllLostItems = async (req, res) => {
  try {
    const { location, status } = req.query;

    const filters = {};
    if (location) filters.location = { contains: location, mode: 'insensitive' };
    if (status) filters.status = status;

    const lostItems = await prisma.lostItem.findMany({
      where: filters,
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(lostItems);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch lost items', error: error.message });
  }
};

// NEW: Delete a lost item (Marking it as found/resolved)
 // @desc   Delete a lost item by ID
// @route  DELETE /api/lost-items/:id
exports.deleteLostItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Tell Prisma to delete the item with this specific ID
    await prisma.lostItem.delete({
      where: { 
        // FIX: We wrap 'id' in parseInt() to convert the String to an Integer!
        id: parseInt(id) 
      }
    });

    res.status(200).json({ message: 'Item successfully marked as found and deleted.' });
  } catch (error) {
    console.error("Error deleting lost item:", error);
    res.status(500).json({ message: 'Server error while deleting item.', error: error.message });
  }
};