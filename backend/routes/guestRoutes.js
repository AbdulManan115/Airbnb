const express = require('express');
const router = express.Router();
const {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest
} = require('../controllers/guestController');

// Get all guests
router.get('/', getGuests);

// Create new guest
router.post('/', createGuest);

// Get guest by ID
router.get('/:id', getGuestById);

// Update guest
router.put('/:id', updateGuest);

// Delete guest
router.delete('/:id', deleteGuest);

module.exports = router;

