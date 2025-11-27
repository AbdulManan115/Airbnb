const express = require('express');
const router = express.Router();
const {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');

// Get all bookings
router.get('/', getBookings);

// Create new booking
router.post('/', createBooking);

// Get booking by ID
router.get('/:id', getBookingById);

// Update booking
router.put('/:id', updateBooking);

// Delete booking
router.delete('/:id', deleteBooking);

module.exports = router;

