const express = require('express');
const { createClub, getAllClubs, getClubById } = require('../controllers/clubController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, restrictTo('SUPER_ADMIN'), createClub);
router.get('/', protect, getAllClubs);
router.get('/:id', protect, getClubById);

module.exports = router;