const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRoleById,
  createRole,
  updateRolePermissions,
  deleteRole,
  getRoleStats
} = require('../controllers/roleController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Get role statistics (all users can view)
router.get('/stats', getRoleStats);

// Get all roles (all users can view - globally shared)
router.get('/', getRoles);

// Get single role by ID (all users can view)
router.get('/:id', getRoleById);

// Create new role (Superadmin only)
router.post('/', authorizeRoles('superadmin'), createRole);

// Update role permissions (Superadmin only)
router.put('/:id/permissions', authorizeRoles('superadmin'), updateRolePermissions);

// Delete role (Superadmin only)
router.delete('/:id', authorizeRoles('superadmin'), deleteRole);

module.exports = router;

