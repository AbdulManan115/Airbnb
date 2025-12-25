const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate Impersonation Token
// Embeds the original token inside the new token for stateless impersonation
const generateImpersonationToken = (hostUser, superadminId, originalToken) => {
  const impersonationExpiry = process.env.IMPERSONATION_TOKEN_EXPIRY || '8h';
  
  return jwt.sign(
    {
      userId: hostUser._id.toString(),
      role: 'host',
      host: true,
      hostId: null,
      impersonation: true,
      impersonatedBy: superadminId,
      originalToken: originalToken // Embed original superadmin token
    },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    {
      expiresIn: impersonationExpiry
    }
  );
};

// Verify and decode token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  generateImpersonationToken,
  verifyToken
};

