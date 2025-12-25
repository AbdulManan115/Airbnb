const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getRoles,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getHosts
} = require('../controllers/userController');

// All user routes require authentication
router.use(protect);

// Get available roles (moved up to avoid route conflicts)
router.get('/roles/list', getRoles);

// Get all hosts (superadmin only)
router.get('/hosts/list', getHosts);

// Get all users
router.get('/', getUsers);

// Create new user
router.post('/', createUser);

// Get user by ID
router.get('/:id', getUserById);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router;

