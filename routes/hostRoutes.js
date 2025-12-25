const express = require('express');
const router = express.Router();
const {
  getHosts,
  getHostById,
  createHost,
  updateHost,
  deleteHost,
  getHostTeam
} = require('../controllers/hostController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Get all hosts (Superadmin only)
router.get('/', authorizeRoles('superadmin'), getHosts);

// Get single host by ID (Superadmin or self)
router.get('/:id', getHostById);

// Get team members for a specific host
router.get('/:id/team', getHostTeam);

// Create new host (Superadmin only)
router.post('/', authorizeRoles('superadmin'), createHost);

// Update host (Superadmin or self)
router.put('/:id', updateHost);

// Delete host (Superadmin only)
router.delete('/:id', authorizeRoles('superadmin'), deleteHost);

module.exports = router;

