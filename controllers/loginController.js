const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if credentials match superadmin from ENV
    const superadminEmail = process.env.SUPERADMIN_EMAIL;
    const superadminPassword = process.env.SUPERADMIN_PASSWORD;

    if (superadminEmail && superadminPassword && 
        email === superadminEmail && password === superadminPassword) {
      // Return superadmin token without checking database
      const superadminToken = generateToken('superadmin');
      
      return res.json({
        success: true,
        token: superadminToken,
        user: {
          id: 'superadmin',
          name: 'Super Admin',
          email: superadminEmail,
          role: 'superadmin',
          isSuperAdmin: true
        }
      });
    }

    // Find user and include password field, populate role
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Prepare user response with populated role
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role, // Complete role object with name and permissions
      host: user.host,
      permissions: user.permissions, // Complete permissions array
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Return user data (without password) and token
    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login
};

