const express = require('express');
const router = express.Router();
const {
  getSuperadminStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/superadminStaffController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Get all superadmin staff (Superadmin only)
router.get('/', authorizeRoles('superadmin'), getSuperadminStaff);

// Get single staff member by ID
router.get('/:id', getStaffById);

// Create new staff member (Superadmin only)
router.post('/', authorizeRoles('superadmin'), createStaff);

// Update staff member
router.put('/:id', updateStaff);

// Delete staff member (Superadmin only)
router.delete('/:id', authorizeRoles('superadmin'), deleteStaff);

module.exports = router;

