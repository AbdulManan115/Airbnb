const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
  updatePaymentStatus
} = require('../controllers/bookingController');

// All booking routes require authentication
router.use(protect);

// Get all bookings
router.get('/', getBookings);

// Create new booking
router.post('/', createBooking);

// Get booking by ID
router.get('/:id', getBookingById);

// Update booking
router.put('/:id', updateBooking);

// Update booking status only
router.patch('/:id/status', updateBookingStatus);

// Update payment status only
router.patch('/:id/payment-status', updatePaymentStatus);

// Delete booking
router.delete('/:id', deleteBooking);

module.exports = router;

