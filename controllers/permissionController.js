const Permission = require('../models/Permission');

const ROLE_KEYS = ['admin', 'manager', 'staff'];

const normalizeRoles = (roles = {}) => {
  const normalized = {};
  ROLE_KEYS.forEach(role => {
    normalized[role] = Boolean(roles && roles[role]);
  });
  return normalized;
};

const hasAnyRoleAssigned = roles =>
  ROLE_KEYS.some(role => roles[role]);

const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ name: 1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPermission = async (req, res) => {
  const { name, description, roles } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({ 
      error: 'Name is required' 
    });
  }

  // Validate name length
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ 
      error: 'Name must be between 2 and 50 characters' 
    });
  }

  // Validate roles
  if (!roles || typeof roles !== 'object') {
    return res.status(400).json({
      error: 'Roles object is required'
    });
  }

  const normalizedRoles = normalizeRoles(roles);

  if (!hasAnyRoleAssigned(normalizedRoles)) {
    return res.status(400).json({ 
      error: 'At least one role must be granted access' 
    });
  }

  try {
    const permissionData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      roles: normalizedRoles
    };

    const permission = new Permission(permissionData);
    const newPermission = await permission.save();

    res.status(201).json(newPermission);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Permission name already exists' 
      });
    }
    res.status(400).json({ error: error.message });
  }
};

const updatePermission = async (req, res) => {
  const { name, description, roles } = req.body;

  if (name && (name.length < 2 || name.length > 50)) {
    return res.status(400).json({ 
      error: 'Name must be between 2 and 50 characters' 
    });
  }

  if (roles !== undefined) {
    if (roles === null || typeof roles !== 'object') {
      return res.status(400).json({
        error: 'Roles must be an object'
      });
    }

    const normalizedRoles = normalizeRoles(roles);

    if (!hasAnyRoleAssigned(normalizedRoles)) {
      return res.status(400).json({
        error: 'At least one role must be granted access'
      });
    }
  }

  try {
    const updateData = {};
    if (typeof name !== 'undefined') updateData.name = name.trim();
    if (typeof description !== 'undefined') updateData.description = description ? description.trim() : '';
    if (typeof roles !== 'undefined') updateData.roles = normalizeRoles(roles);

    const updatedPermission = await Permission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, overwrite: false }
    );

    if (!updatedPermission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    res.json(updatedPermission);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Permission name already exists' 
      });
    }
    res.status(400).json({ error: error.message });
  }
};

const deletePermission = async (req, res) => {
  try {
    const deletedPermission = await Permission.findByIdAndDelete(req.params.id);
    if (!deletedPermission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission
};

