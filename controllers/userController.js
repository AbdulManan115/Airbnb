const User = require('../models/User');
const Role = require('../models/Role');
const { getUserRoleName } = require('../middleware/authMiddleware');
const { getEffectiveHostId, isSuperAdmin, isHost } = require('../middleware/multiTenantMiddleware');

const getRoles = async (req, res) => {
  try {
    // Get roles from Role collection
    let query = {};
    
    // If not superadmin, only show their roles
    const userRole = getUserRoleName(req.user);
    if (userRole !== 'superadmin') {
      const userId = req.user.id || req.user._id;
      query.createdBy = userId;
    }
    
    const roles = await Role.find(query).select('_id name permissions');
    
    res.json({
      success: true,
      roles: roles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const user = req.user;
    const effectiveHostId = getEffectiveHostId(req);
    
    let query = {};
    
    // Superadmin sees all users
    if (isSuperAdmin(user)) {
      // No filter needed
    }
    // Hosts see their team members (users with hostId = host's ID)
    else if (isHost(user)) {
      query.hostId = effectiveHostId;
    }
    // Team members see only themselves (or can be restricted further)
    else {
      // Team members can only see themselves
      query._id = user._id || user.id;
    }
    
    const users = await User.find(query)
      .populate('role', 'name permissions') // Populate complete role object
      .populate('permissions', 'name sub_permissions')
      .populate('hostId', 'name email') // Populate host info for team members
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const currentUser = req.user;
    const effectiveHostId = getEffectiveHostId(req);
    
    // Build query based on user role
    let query = { _id: req.params.id };
    
    // If not superadmin, apply access control
    if (!isSuperAdmin(currentUser)) {
      if (isHost(currentUser)) {
        // Hosts can see their team members or themselves
        query.$or = [
          { _id: req.params.id, hostId: effectiveHostId }, // Team member
          { _id: currentUser._id || currentUser.id } // Self
        ];
      } else {
        // Team members can only see themselves
        query._id = currentUser._id || currentUser.id;
      }
    }
    
    const user = await User.findOne(query)
      .populate('role', 'name permissions') // Populate complete role object
      .populate('permissions', 'name sub_permissions')
      .populate('hostId', 'name email'); // Populate host info
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  const { name, email, phone, password, role, host, permissions } = req.body;
  const currentUser = req.user;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Password must be at least 6 characters
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  // Validate role if provided (should be a Role ObjectId)
  if (role) {
    try {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({ error: 'Invalid role ID' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid role ID format' });
    }
  }

  // Validate permissions if provided
  if (permissions && Array.isArray(permissions)) {
    const Permission = require('../models/Permission');
    try {
      const validPermissions = await Permission.find({ _id: { $in: permissions } });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({ error: 'One or more permission IDs are invalid' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid permission IDs' });
    }
  }

  try {
    const userData = {
      name,
      email,
      phone: phone || null,
      password,
      role: role || null, // Role ObjectId or null
      host: host || false,
      permissions: permissions || []
    };

    // If the current user is a host creating a team member
    // (i.e., host field is false or not provided), set hostId to the current user's ID
    if (isHost(currentUser) && !host) {
      userData.hostId = currentUser._id || currentUser.id;
    }
    
    // If superadmin is creating a host, hostId should be null
    // If superadmin is creating a team member, they should specify hostId in the request
    if (isSuperAdmin(currentUser)) {
      // Superadmin can specify hostId manually if creating team member
      if (req.body.hostId) {
        userData.hostId = req.body.hostId;
      }
    }

    const user = new User(userData);
    const newUser = await user.save();
    
    // Populate role, permissions, and hostId before returning
    await newUser.populate('role', 'name permissions');
    await newUser.populate('permissions', 'name sub_permissions');
    await newUser.populate('hostId', 'name email');
    
    // Remove password from response
    const userResponse = newUser.toJSON();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  const { name, email, phone, role, host, permissions, hostId } = req.body;
  const currentUser = req.user;
  const effectiveHostId = getEffectiveHostId(req);

  // Validate role if provided (should be a Role ObjectId)
  if (role !== undefined && role !== null) {
    try {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({ error: 'Invalid role ID' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid role ID format' });
    }
  }

  // Validate permissions if provided
  if (permissions !== undefined) {
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }
    const Permission = require('../models/Permission');
    try {
      const validPermissions = await Permission.find({ _id: { $in: permissions } });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({ error: 'One or more permission IDs are invalid' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid permission IDs' });
    }
  }

  try {
    // Check if user can update the target user
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Access control: Only superadmin or the host can update their team members
    if (!isSuperAdmin(currentUser)) {
      if (isHost(currentUser)) {
        // Hosts can only update their team members or themselves
        const targetUserId = targetUser._id.toString();
        const currentUserId = (currentUser._id || currentUser.id).toString();
        const targetHostId = targetUser.hostId ? targetUser.hostId.toString() : null;
        
        if (targetUserId !== currentUserId && targetHostId !== effectiveHostId.toString()) {
          return res.status(403).json({ error: 'Access denied. You can only update your team members.' });
        }
      } else {
        // Team members can only update themselves
        if (targetUser._id.toString() !== (currentUser._id || currentUser.id).toString()) {
          return res.status(403).json({ error: 'Access denied. You can only update your own profile.' });
        }
      }
    }

    const updateData = {};
    if (typeof name !== 'undefined') updateData.name = name;
    if (typeof email !== 'undefined') updateData.email = email;
    if (typeof phone !== 'undefined') updateData.phone = phone;
    if (typeof role !== 'undefined') updateData.role = role;
    if (typeof host !== 'undefined') updateData.host = host;
    if (typeof permissions !== 'undefined') updateData.permissions = permissions;
    
    // Only superadmin can update hostId
    if (typeof hostId !== 'undefined' && isSuperAdmin(currentUser)) {
      updateData.hostId = hostId;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, overwrite: false }
    )
      .populate('role', 'name permissions') // Populate complete role object
      .populate('permissions', 'name sub_permissions')
      .populate('hostId', 'name email'); // Populate host info

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const effectiveHostId = getEffectiveHostId(req);
    
    // Check if user can delete the target user
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Access control: Only superadmin or the host can delete their team members
    if (!isSuperAdmin(currentUser)) {
      if (isHost(currentUser)) {
        // Hosts can only delete their team members (not themselves)
        const targetHostId = targetUser.hostId ? targetUser.hostId.toString() : null;
        
        if (targetHostId !== effectiveHostId.toString()) {
          return res.status(403).json({ error: 'Access denied. You can only delete your team members.' });
        }
      } else {
        // Team members cannot delete users
        return res.status(403).json({ error: 'Access denied. You do not have permission to delete users.' });
      }
    }
    
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all hosts (users with host: true)
 * Only accessible by superadmin
 */
const getHosts = async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Only superadmin can access this
    if (!isSuperAdmin(currentUser)) {
      return res.status(403).json({ 
        error: 'Access denied. Only superadmin can view all hosts.' 
      });
    }
    
    // Find all users with host: true
    const hosts = await User.find({ host: true })
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions')
      .sort({ createdAt: -1 });
    
    // For each host, get their statistics
    const Property = require('../models/Property');
    const Booking = require('../models/Booking');
    const Guest = require('../models/Guest');
    const Payment = require('../models/Payment');
    
    const hostsWithStats = await Promise.all(hosts.map(async (host) => {
      const hostId = host._id;
      
      const [propertyCount, bookingCount, guestCount, paymentCount, teamMemberCount] = await Promise.all([
        Property.countDocuments({ hostId }),
        Booking.countDocuments({ hostId }),
        Guest.countDocuments({ hostId }),
        Payment.countDocuments({ hostId }),
        User.countDocuments({ hostId })
      ]);
      
      // Calculate total revenue
      const payments = await Payment.find({ hostId });
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      return {
        ...host.toJSON(),
        stats: {
          properties: propertyCount,
          bookings: bookingCount,
          guests: guestCount,
          payments: paymentCount,
          teamMembers: teamMemberCount,
          totalRevenue
        }
      };
    }));
    
    res.json({
      success: true,
      count: hostsWithStats.length,
      hosts: hostsWithStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRoles,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getHosts
};

