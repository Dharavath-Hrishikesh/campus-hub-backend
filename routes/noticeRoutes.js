const express = require('express');
const { createNotice, getAllNotices } = require('../controllers/noticeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Single endpoint handles both global and club notices;
// the controller enforces SUPER_ADMIN-only for global, and club-ownership for CLUB_ADMIN.
router.post('/', protect, restrictTo('CLUB_ADMIN', 'SUPER_ADMIN'), createNotice);
router.get('/', protect, getAllNotices);

module.exports = router;