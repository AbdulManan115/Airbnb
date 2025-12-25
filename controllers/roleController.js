const Role = require('../models/Role');
const mongoose = require('mongoose');
const { getUserRoleName } = require('../middleware/authMiddleware');

// Get all roles
const getRoles = async (req, res) => {
  try {
    // All users see all roles (globally shared)
    const roles = await Role.find({})
      .sort({ name: 1 });

    res.json({
      success: true,
      count: roles.length,
      roles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single role by ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // All users can view roles (globally shared)
    res.json({
      success: true,
      role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new role (Superadmin only)
const createRole = async (req, res) => {
  try {
    const { name } = req.body;

    // Only superadmin can create roles
    const userRole = getUserRoleName(req.user);
    if (userRole !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Access denied. Only superadmin can create roles.' 
      });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate name length
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ 
        error: 'Role name must be between 2 and 50 characters' 
      });
    }

    // Check if role already exists (globally)
    const existingRole = await Role.findOne({ 
      name: name.toLowerCase()
    });

    if (existingRole) {
      return res.status(400).json({ 
        error: `Role '${name}' already exists` 
      });
    }

    // Create new global role without permissions
    const role = new Role({
      name: name.toLowerCase(),
      permissions: [],
      createdBy: null  // Global roles have no owner
    });

    await role.save();

    res.status(201).json({
      success: true,
      message: 'Global role created successfully. Use the update permissions endpoint to add permissions.',
      role
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Role already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update role permissions (Superadmin only)
const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Only superadmin can update role permissions
    const userRole = getUserRoleName(req.user);
    if (userRole !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Access denied. Only superadmin can update role permissions.' 
      });
    }

    // Validate permissions
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ 
        error: 'Permissions must be provided as an array' 
      });
    }

    // Find role
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Update permissions
    role.permissions = permissions;
    await role.save();

    res.json({
      success: true,
      message: 'Role permissions updated successfully',
      role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete role (Superadmin only)
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Only superadmin can delete roles
    const userRole = getUserRoleName(req.user);
    if (userRole !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Access denied. Only superadmin can delete roles.' 
      });
    }

    // Find role
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await Role.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get role statistics
const getRoleStats = async (req, res) => {
  try {
    // All users see stats for all roles (globally shared)
    const totalRoles = await Role.countDocuments({});

    // Count roles by name
    const rolesByName = await Role.aggregate([
      {
        $group: {
          _id: '$name',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: totalRoles,
      byName: {}
    };

    rolesByName.forEach(item => {
      stats.byName[item._id] = item.count;
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRolePermissions,
  deleteRole,
  getRoleStats
};

