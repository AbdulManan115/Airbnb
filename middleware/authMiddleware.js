const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('❌ No token found in request');
      console.log('Authorization header:', req.headers.authorization);
      return res.status(401).json({ 
        error: 'Not authorized to access this route',
        hint: 'Please include Authorization header with Bearer token'
      });
    }

    console.log('✅ Token found, verifying...');

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

      // Check if this is superadmin token
      if (decoded.userId === 'superadmin') {
        req.user = {
          _id: 'superadmin',
          id: 'superadmin',
          name: 'Super Admin',
          email: process.env.SUPERADMIN_EMAIL,
          role: 'superadmin'
        };
        return next();
      }

      // Get user from token and attach to request, populate role
      const user = await User.findById(decoded.userId)
        .select('-password')
        .populate('role', 'name permissions')
        .populate('permissions', 'name sub_permissions');

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if user is superadmin
const isSuperAdmin = (req, res, next) => {
  const userRole = typeof req.user.role === 'string' ? req.user.role : req.user.role?.name;
  if (req.user && userRole === 'superadmin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Superadmin only.' });
  }
};


// Alias for protect (used by some routes as 'authenticate')
const authenticate = protect;

// Authorize specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = typeof req.user.role === 'string' ? req.user.role : req.user.role?.name;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Helper function to get role name from user object
// Handles both string roles (superadmin) and populated Role objects
const getUserRoleName = (user) => {
  if (!user || !user.role) return null;
  return typeof user.role === 'string' ? user.role : user.role.name;
};

module.exports = {
  protect,
  authenticate,
  isSuperAdmin,
  authorizeRoles,
  getUserRoleName
};

