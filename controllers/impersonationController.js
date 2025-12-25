const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateImpersonationToken, verifyToken } = require('../utils/jwtUtils');

/**
 * Impersonate a host user
 * POST /api/superadmin/impersonate/:hostId
 * 
 * Allows a superadmin to switch their session to view the platform as a specific host.
 * The original superadmin token is embedded in the new impersonation token.
 */
const impersonateHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    const superadmin = req.user;

    // Verify superadmin permission
    const userRole = typeof superadmin.role === 'string' 
      ? superadmin.role 
      : superadmin.role?.name;

    if (userRole !== 'superadmin') {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized. Superadmin access required.' 
      });
    }

    // Validate hostId format
    if (!hostId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid host ID format' 
      });
    }

    // Fetch host user
    const host = await User.findById(hostId)
      .select('-password')
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions');

    if (!host) {
      return res.status(404).json({ 
        success: false,
        error: 'Host not found' 
      });
    }

    // Verify the user is actually a host (host: true and hostId: null)
    if (!host.host || host.hostId !== null) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot impersonate non-host users. User must be a host account.' 
      });
    }

    // Get the original token from the request
    const originalToken = req.headers.authorization?.split(' ')[1];
    
    if (!originalToken) {
      return res.status(401).json({ 
        success: false,
        error: 'Authorization token not found' 
      });
    }

    // Get superadmin ID (handle both 'superadmin' string and ObjectId)
    const superadminId = superadmin._id || superadmin.id || 'superadmin';
    const superadminEmail = superadmin.email;

    // Create impersonation token with embedded original token
    const impersonationToken = generateImpersonationToken(
      host,
      superadminId,
      originalToken
    );

    // Prepare user response with impersonatedBy field
    const userResponse = {
      _id: host._id,
      id: host._id,
      name: host.name,
      email: host.email,
      phone: host.phone,
      role: host.role,
      host: host.host,
      hostId: host.hostId,
      permissions: host.permissions,
      businessName: host.businessName,
      impersonatedBy: superadminId,
      createdAt: host.createdAt,
      updatedAt: host.updatedAt
    };

    // Log the impersonation action
    await AuditLog.create({
      action: 'IMPERSONATION_START',
      superadminId: superadminId,
      superadminEmail: superadminEmail,
      targetUserId: host._id,
      targetUserEmail: host.email,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });

    // Return success response
    res.json({
      success: true,
      token: impersonationToken,
      user: userResponse
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to impersonate host' 
    });
  }
};

/**
 * Stop impersonating and return to original superadmin session
 * POST /api/superadmin/stop-impersonation
 * 
 * Returns from an impersonated host session back to the original superadmin session.
 * Extracts and returns the embedded original token.
 */
const stopImpersonation = async (req, res) => {
  try {
    const currentToken = req.headers.authorization?.split(' ')[1];
    
    if (!currentToken) {
      return res.status(401).json({ 
        success: false,
        error: 'Authorization token not found' 
      });
    }

    // Decode current token to check if it's an impersonation token
    let tokenData;
    try {
      tokenData = verifyToken(currentToken);
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token' 
      });
    }

    // Verify this is an impersonated session
    if (!tokenData.impersonation || !tokenData.originalToken) {
      return res.status(400).json({ 
        success: false,
        error: 'Not currently impersonating any user' 
      });
    }

    // Verify and decode the original token
    let originalTokenData;
    try {
      originalTokenData = verifyToken(tokenData.originalToken);
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        error: 'Original session has expired. Please login again.' 
      });
    }

    // Get superadmin user data
    let superadmin;
    
    // Handle superadmin string (ENV-based superadmin)
    if (originalTokenData.userId === 'superadmin') {
      superadmin = {
        _id: 'superadmin',
        id: 'superadmin',
        name: 'Super Admin',
        email: process.env.SUPERADMIN_EMAIL,
        role: 'superadmin',
        permissions: ['all'],
        isSuperAdmin: true
      };
    } else {
      // Regular user-based superadmin
      superadmin = await User.findById(originalTokenData.userId)
        .select('-password')
        .populate('role', 'name permissions')
        .populate('permissions', 'name sub_permissions');

      if (!superadmin) {
        return res.status(401).json({ 
          success: false,
          error: 'Original user not found. Please login again.' 
        });
      }
    }

    // Calculate impersonation duration
    const impersonationStartTime = tokenData.iat * 1000; // JWT iat is in seconds
    const currentTime = Date.now();
    const duration = currentTime - impersonationStartTime;

    // Get the host user to retrieve their email for audit log
    const hostUser = await User.findById(tokenData.userId).select('email');
    const targetUserEmail = hostUser ? hostUser.email : 'unknown';

    // Log the end of impersonation
    await AuditLog.create({
      action: 'IMPERSONATION_END',
      superadminId: tokenData.impersonatedBy,
      superadminEmail: superadmin.email,
      targetUserId: tokenData.userId,
      targetUserEmail: targetUserEmail,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      duration: duration,
      timestamp: new Date()
    });

    // Prepare superadmin user response
    const userResponse = superadmin._id ? {
      _id: superadmin._id,
      id: superadmin._id,
      name: superadmin.name,
      email: superadmin.email,
      phone: superadmin.phone,
      role: superadmin.role,
      permissions: superadmin.permissions,
      createdAt: superadmin.createdAt,
      updatedAt: superadmin.updatedAt
    } : superadmin;

    // Return the original token
    res.json({
      success: true,
      token: tokenData.originalToken,
      user: userResponse
    });

  } catch (error) {
    console.error('Stop impersonation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to stop impersonation' 
    });
  }
};

module.exports = {
  impersonateHost,
  stopImpersonation
};

