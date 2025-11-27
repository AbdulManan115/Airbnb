const express = require('express');
const router = express.Router();
const { login } = require('../controllers/loginController');
const { register } = require('../controllers/registerController');

// Login route
router.post('/login', login);

// Register route
router.post('/register', register);

module.exports = router;

