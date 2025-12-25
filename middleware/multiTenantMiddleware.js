const { getUserRoleName } = require('./authMiddleware');

/**
 * Get the effective host ID for the current user
 * - Superadmin: returns null (can see all data)
 * - Host: returns their own user ID
 * - Team member: returns their hostId
 */
const getEffectiveHostId = (req) => {
  const user = req.user;
  
  if (!user) {
    return null;
  }

  // Check if superadmin
  const roleName = getUserRoleName(user);
  if (roleName === 'superadmin') {
    return null; // Superadmin can see all data
  }

  // If user is a host, return their own ID
  if (user.host === true) {
    return user._id || user.id;
  }

  // If user is a team member, return their hostId
  if (user.hostId) {
    return user.hostId;
  }

  // Default: return user's own ID (fallback)
  return user._id || user.id;
};

/**
 * Middleware to apply host-based filtering to queries
 * Adds hostId filter to req.query unless user is superadmin
 * 
 * Usage: Apply this middleware to any route that needs multi-tenant filtering
 */
const applyHostFilter = (req, res, next) => {
  const effectiveHostId = getEffectiveHostId(req);
  
  // If effectiveHostId is null, user is superadmin - no filter needed
  if (effectiveHostId !== null) {
    req.hostFilter = { hostId: effectiveHostId };
  } else {
    req.hostFilter = {}; // Empty filter for superadmin
  }
  
  next();
};

/**
 * Middleware to check if user can access a specific resource
 * Use this when checking access to a single resource (e.g., GET /api/properties/:id)
 */
const canAccessResource = (resource) => {
  return (req, res, next) => {
    const user = req.user;
    const roleName = getUserRoleName(user);
    
    // Superadmin can access everything
    if (roleName === 'superadmin') {
      return next();
    }

    const effectiveHostId = getEffectiveHostId(req);
    const resourceHostId = resource.hostId ? resource.hostId.toString() : null;
    
    // Check if user can access this resource
    if (effectiveHostId && resourceHostId && effectiveHostId.toString() === resourceHostId) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied. You do not have permission to access this resource.'
    });
  };
};

/**
 * Middleware to authorize host-only actions
 * Team members cannot perform certain actions (e.g., creating other team members)
 */
const authorizeHost = (req, res, next) => {
  const user = req.user;
  const roleName = getUserRoleName(user);
  
  // Superadmin can do anything
  if (roleName === 'superadmin') {
    return next();
  }

  // Check if user is a host
  if (user.host === true) {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied. Only hosts can perform this action.'
  });
};

/**
 * Middleware to ensure resource belongs to user's host
 * Use before update/delete operations
 */
const validateHostOwnership = async (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const roleName = getUserRoleName(user);
      
      // Superadmin bypasses all checks
      if (roleName === 'superadmin') {
        return next();
      }

      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const effectiveHostId = getEffectiveHostId(req);
      const resourceHostId = resource.hostId ? resource.hostId.toString() : null;

      if (effectiveHostId && resourceHostId && effectiveHostId.toString() === resourceHostId) {
        req.resource = resource; // Attach resource to request for use in controller
        return next();
      }

      return res.status(403).json({
        error: 'Access denied. You do not have permission to modify this resource.'
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Helper to check if user is superadmin
 */
const isSuperAdmin = (user) => {
  const roleName = getUserRoleName(user);
  return roleName === 'superadmin';
};

/**
 * Helper to check if user is a host
 */
const isHost = (user) => {
  return user.host === true;
};

/**
 * Helper to check if user is a team member
 */
const isTeamMember = (user) => {
  return user.host === false && user.hostId !== null && user.hostId !== undefined;
};

module.exports = {
  getEffectiveHostId,
  applyHostFilter,
  canAccessResource,
  authorizeHost,
  validateHostOwnership,
  isSuperAdmin,
  isHost,
  isTeamMember
};

