const express = require('express');
const router = express.Router();
const {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission
} = require('../controllers/permissionController');

// Get all permissions
router.get('/', getPermissions);

// Create new permission
router.post('/', createPermission);

// Get permission by ID
router.get('/:id', getPermissionById);

// Update permission
router.put('/:id', updatePermission);

// Delete permission
router.delete('/:id', deletePermission);

module.exports = router;

