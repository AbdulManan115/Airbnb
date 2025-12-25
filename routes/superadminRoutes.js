const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin } = require('../middleware/authMiddleware');
const {
  getAllHosts,
  getHostDetails,
  getHostUsers,
  getHostProperties,
  getHostBookings,
  getHostGuests,
  getHostTasks,
  getHostPayments,
  getSystemStatistics
} = require('../controllers/superadminController');

// All routes require superadmin authentication
router.use(protect);
router.use(isSuperAdmin);

// System statistics
router.get('/statistics', getSystemStatistics);

// Host management
router.get('/hosts', getAllHosts);
router.get('/hosts/:hostId', getHostDetails);
router.get('/hosts/:hostId/users', getHostUsers);
router.get('/hosts/:hostId/properties', getHostProperties);
router.get('/hosts/:hostId/bookings', getHostBookings);
router.get('/hosts/:hostId/guests', getHostGuests);
router.get('/hosts/:hostId/tasks', getHostTasks);
router.get('/hosts/:hostId/payments', getHostPayments);

module.exports = router;

