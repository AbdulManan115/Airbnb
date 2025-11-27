const express = require('express');
const router = express.Router();
const {
  getRoles,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// Get available roles (moved up to avoid route conflicts)
router.get('/roles/list', getRoles);

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

