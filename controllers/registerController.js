const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

// Register new host (signup creates a host account)
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create host user (anyone who registers becomes a host)
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: null, // Role can be assigned later via user management API
      host: true, // This user is a host
      hostId: null // Hosts don't have a hostId
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        host: user.host,
        hostId: user.hostId,
        createdAt: user.createdAt
      },
      message: 'Host account created successfully. You can assign a role later via user management.'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  register
};

