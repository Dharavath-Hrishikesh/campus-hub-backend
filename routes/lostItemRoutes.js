const express = require('express');
// NEW: Imported the deleteLostItem function from your controller
const { createLostItem, getAllLostItems, deleteLostItem } = require('../controllers/lostItemController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', protect, upload.single('image'), createLostItem);
router.get('/', protect, getAllLostItems);

// NEW: Added the DELETE route to handle marking items as found
router.delete('/:id', protect, deleteLostItem);

module.exports = router;