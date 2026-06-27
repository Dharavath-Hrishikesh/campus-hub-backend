const express = require('express');
const { createEvent, getAllEvents, rsvpToEvent } = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, restrictTo('CLUB_ADMIN', 'SUPER_ADMIN'), createEvent);
router.get('/', protect, getAllEvents);
router.post('/:id/rsvp', protect, rsvpToEvent);

module.exports = router;