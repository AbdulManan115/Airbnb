const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  addSubPermission
} = require('../controllers/permissionController');

// All permission routes require authentication
router.use(protect);

// Get all permissions
router.get('/', getPermissions);

// Create new permission
router.post('/', createPermission);

// Get permission by ID
router.get('/:id', getPermissionById);

// Update permission
router.put('/:id', updatePermission);

// Add sub-permission to existing permission
router.post('/:id/sub-permission', addSubPermission);

// Delete permission
router.delete('/:id', deletePermission);

module.exports = router;

