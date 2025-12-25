const User = require('../models/User');
const { isSuperAdmin, getUserRoleName } = require('../middleware/authMiddleware');

// Get all hosts
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
      .select('-password')
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions')
      .sort({ createdAt: -1 });
    
    // Get statistics for each host
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
        User.countDocuments({ hostId, host: false })
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

// Get single host by ID
const getHostById = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    
    // Check access: superadmin can see any host, hosts can only see themselves
    const currentUserId = currentUser._id || currentUser.id;
    if (!isSuperAdmin(currentUser) && currentUserId.toString() !== id) {
      return res.status(403).json({ 
        error: 'Access denied. You can only view your own profile.' 
      });
    }
    
    const host = await User.findOne({ _id: id, host: true })
      .select('-password')
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions');
    
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }
    
    // Get host statistics
    const Property = require('../models/Property');
    const Booking = require('../models/Booking');
    const Guest = require('../models/Guest');
    const Payment = require('../models/Payment');
    
    const hostId = host._id;
    
    const [propertyCount, bookingCount, guestCount, paymentCount, teamMemberCount] = await Promise.all([
      Property.countDocuments({ hostId }),
      Booking.countDocuments({ hostId }),
      Guest.countDocuments({ hostId }),
      Payment.countDocuments({ hostId }),
      User.countDocuments({ hostId, host: false })
    ]);
    
    // Calculate total revenue
    const payments = await Payment.find({ hostId });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const hostWithStats = {
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
    
    res.json({
      success: true,
      host: hostWithStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new host (Superadmin only)
const createHost = async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Only superadmin can create hosts
    if (!isSuperAdmin(currentUser)) {
      return res.status(403).json({ 
        error: 'Access denied. Only superadmin can create hosts.' 
      });
    }
    
    const { name, email, phone, password, role, permissions, businessName } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Validate role if provided
    if (role) {
      const Role = require('../models/Role');
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({ error: 'Invalid role ID' });
      }
    }
    
    // Validate permissions if provided
    if (permissions && Array.isArray(permissions)) {
      const Permission = require('../models/Permission');
      const validPermissions = await Permission.find({ _id: { $in: permissions } });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({ error: 'One or more permission IDs are invalid' });
      }
    }
    
    // Create host
    const host = new User({
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      password,
      host: true,
      hostId: null,
      role: role || null,
      permissions: permissions || [],
      businessName: businessName || null
    });
    
    await host.save();
    
    // Populate and return
    await host.populate('role', 'name permissions');
    await host.populate('permissions', 'name sub_permissions');
    
    const hostResponse = host.toJSON();
    delete hostResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Host created successfully',
      host: hostResponse
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update host
const updateHost = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { name, email, phone, role, permissions, businessName } = req.body;
    
    // Check access: superadmin can update any host, hosts can update themselves
    const currentUserId = currentUser._id || currentUser.id;
    if (!isSuperAdmin(currentUser) && currentUserId.toString() !== id) {
      return res.status(403).json({ 
        error: 'Access denied. You can only update your own profile.' 
      });
    }
    
    // Find host
    const host = await User.findOne({ _id: id, host: true });
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }
    
    // Validate role if provided
    if (role) {
      const Role = require('../models/Role');
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({ error: 'Invalid role ID' });
      }
    }
    
    // Validate permissions if provided
    if (permissions && Array.isArray(permissions)) {
      const Permission = require('../models/Permission');
      const validPermissions = await Permission.find({ _id: { $in: permissions } });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({ error: 'One or more permission IDs are invalid' });
      }
    }
    
    // Build update data
    const updateData = {};
    if (typeof name !== 'undefined') updateData.name = name;
    if (typeof email !== 'undefined') updateData.email = email;
    if (typeof phone !== 'undefined') updateData.phone = phone;
    if (typeof role !== 'undefined') updateData.role = role;
    if (typeof permissions !== 'undefined') updateData.permissions = permissions;
    if (typeof businessName !== 'undefined') updateData.businessName = businessName;
    
    // Update host
    const updatedHost = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions');
    
    res.json({
      success: true,
      message: 'Host updated successfully',
      host: updatedHost
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete host (Superadmin only)
const deleteHost = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    
    // Only superadmin can delete hosts
    if (!isSuperAdmin(currentUser)) {
      return res.status(403).json({ 
        error: 'Access denied. Only superadmin can delete hosts.' 
      });
    }
    
    // Find host
    const host = await User.findOne({ _id: id, host: true });
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }
    
    // Check if host has any data (optional - you might want to prevent deletion if they have properties/bookings)
    const Property = require('../models/Property');
    const propertyCount = await Property.countDocuments({ hostId: id });
    
    if (propertyCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete host. They have ${propertyCount} properties. Please delete or reassign properties first.` 
      });
    }
    
    // Delete host
    await User.findByIdAndDelete(id);
    
    // Optional: Also delete all their team members
    await User.deleteMany({ hostId: id, host: false });
    
    res.json({
      success: true,
      message: 'Host deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all team members for a specific host
const getHostTeam = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    
    // Check access: superadmin can see any host's team, hosts can see their own team
    const currentUserId = currentUser._id || currentUser.id;
    if (!isSuperAdmin(currentUser) && currentUserId.toString() !== id) {
      return res.status(403).json({ 
        error: 'Access denied. You can only view your own team.' 
      });
    }
    
    // Find all team members for this host
    const teamMembers = await User.find({ hostId: id, host: false })
      .select('-password')
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: teamMembers.length,
      teamMembers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getHosts,
  getHostById,
  createHost,
  updateHost,
  deleteHost,
  getHostTeam
};

