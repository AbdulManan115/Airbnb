const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

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

      // Handle impersonation token
      if (decoded.impersonation) {
        console.log('🎭 Impersonation token detected');
        
        // Log impersonated action (optional - can be enabled/disabled via env)
        if (process.env.ENABLE_IMPERSONATION_LOGGING === 'true') {
          // Fire and forget - don't await to avoid slowing down requests
          AuditLog.create({
            action: 'IMPERSONATION_ACTION',
            superadminId: decoded.impersonatedBy,
            superadminEmail: '', // We don't have this readily available
            targetUserId: decoded.userId,
            targetUserEmail: '',
            endpoint: req.originalUrl || req.url,
            method: req.method,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            timestamp: new Date()
          }).catch(err => console.error('Failed to log impersonation action:', err));
        }

        // Get host user from token and attach to request
        const host = await User.findById(decoded.userId)
          .select('-password')
          .populate('role', 'name permissions')
          .populate('permissions', 'name sub_permissions');

        if (!host) {
          return res.status(401).json({ error: 'Impersonated user not found' });
        }

        // Attach user with impersonation metadata
        req.user = {
          ...host.toObject(),
          impersonation: true,
          impersonatedBy: decoded.impersonatedBy
        };
        
        req.isImpersonating = true;
        return next();
      }

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

