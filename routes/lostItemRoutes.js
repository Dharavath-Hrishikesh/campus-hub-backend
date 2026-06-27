const express = require('express');
const { createLostItem, getAllLostItems } = require('../controllers/lostItemController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', protect, upload.single('image'), createLostItem);
router.get('/', protect, getAllLostItems);

module.exports = router;