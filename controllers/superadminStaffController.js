const User = require('../models/User');
const { isSuperAdmin } = require('../middleware/authMiddleware');

// Get all superadmin staff
const getSuperadminStaff = async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Only superadmin can access this
    if (!isSuperAdmin(currentUser)) {
      return res.status(403).json({ 
        error: 'Access denied. Only superadmin can view staff.' 
      });
    }
    
    // Find all users with hostId: 'superadmin'
    const staff = await User.find({ hostId: 'superadmin', host: false })
      .select('-password')
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single staff member by ID
const getStaffById = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    
    // Superadmin can see any staff, staff can only see themselves
    const currentUserId = currentUser._id || currentUser.id;
    if (!isSuperAdmin(currentUser) && currentUserId.toString() !== id) {
      return res.status(403).json({ 
        error: 'Access denied. You can only view your own profile.' 
      });
    }
    
    const staffMember = await User.findOne({ _id: id, hostId: 'superadmin', host: false })
      .select('-password')
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions');
    
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    res.json({
      success: true,
      staff: staffMember
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new superadmin staff member
const createStaff = async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Only superadmin can create staff
    if (!isSuperAdmin(currentUser)) {
      return res.status(403).json({ 
        error: 'Access denied. Only superadmin can create staff.' 
      });
    }
    
    const { name, email, phone, password, role, permissions, department, accessLevel } = req.body;
    
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
    
    // Create staff member
    const staff = new User({
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      password,
      host: false,
      hostId: 'superadmin', // Special marker for superadmin staff
      role: role || null,
      permissions: permissions || [],
      department: department || null,
      accessLevel: accessLevel || null
    });
    
    await staff.save();
    
    // Populate and return
    await staff.populate('role', 'name permissions');
    await staff.populate('permissions', 'name sub_permissions');
    
    const staffResponse = staff.toJSON();
    delete staffResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff: staffResponse
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update staff member
const updateStaff = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { name, email, phone, role, permissions, department, accessLevel } = req.body;
    
    // Check access: superadmin can update any staff, staff can update themselves
    const currentUserId = currentUser._id || currentUser.id;
    if (!isSuperAdmin(currentUser) && currentUserId.toString() !== id) {
      return res.status(403).json({ 
        error: 'Access denied. You can only update your own profile.' 
      });
    }
    
    // Find staff member
    const staffMember = await User.findOne({ _id: id, hostId: 'superadmin', host: false });
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
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
    if (typeof department !== 'undefined') updateData.department = department;
    
    // Only superadmin can change accessLevel
    if (typeof accessLevel !== 'undefined' && isSuperAdmin(currentUser)) {
      updateData.accessLevel = accessLevel;
    }
    
    // Update staff member
    const updatedStaff = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('role', 'name permissions')
      .populate('permissions', 'name sub_permissions');
    
    res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: updatedStaff
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete staff member
const deleteStaff = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    
    // Only superadmin can delete staff
    if (!isSuperAdmin(currentUser)) {
      return res.status(403).json({ 
        error: 'Access denied. Only superadmin can delete staff.' 
      });
    }
    
    // Find staff member
    const staffMember = await User.findOne({ _id: id, hostId: 'superadmin', host: false });
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    // Delete staff member
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSuperadminStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff
};

