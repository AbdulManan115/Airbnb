const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadGuestFiles } = require('../middleware/uploadMiddleware');
const {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  getGuestBookings
} = require('../controllers/guestController');

// All guest routes require authentication
router.use(protect);

// Get all guests
router.get('/', getGuests);

// Create new guest (with optional file uploads)
router.post('/', uploadGuestFiles, createGuest);

// Get guest booking history
router.get('/:id/bookings', getGuestBookings);

// Get guest by ID
router.get('/:id', getGuestById);

// Update guest (with optional file uploads)
router.put('/:id', uploadGuestFiles, updateGuest);

// Delete guest
router.delete('/:id', deleteGuest);

module.exports = router;

