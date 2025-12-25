const Permission = require('../models/Permission');

/**
 * Validate sub_permissions structure recursively
 * Ensures proper format with name and sub_permissions fields
 */
const validateSubPermissions = (subPermissions) => {
  if (!Array.isArray(subPermissions)) {
    return { valid: false, message: 'sub_permissions must be an array' };
  }

  for (let i = 0; i < subPermissions.length; i++) {
    const subPerm = subPermissions[i];
    
    if (!subPerm.name || typeof subPerm.name !== 'string') {
      return { 
        valid: false, 
        message: `sub_permission at index ${i} must have a valid name` 
      };
    }

    // If sub_permissions exists and is not null, it must be an array
    if (subPerm.sub_permissions !== null && subPerm.sub_permissions !== undefined) {
      if (!Array.isArray(subPerm.sub_permissions)) {
        return { 
          valid: false, 
          message: `sub_permissions for "${subPerm.name}" must be an array or null` 
        };
      }
      
      // Recursively validate nested sub_permissions
      if (subPerm.sub_permissions.length > 0) {
        const nestedValidation = validateSubPermissions(subPerm.sub_permissions);
        if (!nestedValidation.valid) {
          return nestedValidation;
        }
      }
    }
  }

  return { valid: true };
};

/**
 * Get all permissions
 * Returns permissions in the format: { status: true, data: [...] }
 */
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ createdAt: -1 });
    
    res.json({
      status: true,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      error: error.message 
    });
  }
};

/**
 * Get a single permission by ID
 */
const getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({ 
        status: false,
        error: 'Permission not found' 
      });
    }
    
    res.json({
      status: true,
      data: permission
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      error: error.message 
    });
  }
};

/**
 * Create a new permission with nested sub_permissions
 * Example body:
 * {
 *   "name": "settings",
 *   "sub_permissions": [
 *     {
 *       "name": "Permissions",
 *       "sub_permissions": [
 *         { "name": "add permissions", "sub_permissions": null },
 *         { "name": "edit permissions", "sub_permissions": null }
 *       ]
 *     }
 *   ]
 * }
 */
const createPermission = async (req, res) => {
  const { name, sub_permissions } = req.body;

  // Validate required fields
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ 
      status: false,
      error: 'Name is required and must be a string' 
    });
  }

  // Validate name length
  if (name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ 
      status: false,
      error: 'Name must be between 2 and 100 characters' 
    });
  }

  // Validate sub_permissions if provided
  if (sub_permissions !== undefined && sub_permissions !== null) {
    if (!Array.isArray(sub_permissions)) {
    return res.status(400).json({
        status: false,
        error: 'sub_permissions must be an array'
    });
  }

    const validation = validateSubPermissions(sub_permissions);
    if (!validation.valid) {
    return res.status(400).json({ 
        status: false,
        error: validation.message
    });
    }
  }

  try {
    const permissionData = {
      name: name.trim(),
      sub_permissions: sub_permissions || []
    };

    const permission = new Permission(permissionData);
    const newPermission = await permission.save();

    res.status(201).json({
      status: true,
      message: 'Permission created successfully',
      data: newPermission
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        status: false,
        error: 'Permission name already exists' 
      });
    }
    res.status(400).json({ 
      status: false,
      error: error.message 
    });
  }
};

/**
 * Update an existing permission
 * Can update name and/or sub_permissions
 */
const updatePermission = async (req, res) => {
  const { name, sub_permissions } = req.body;

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string') {
    return res.status(400).json({ 
        status: false,
        error: 'Name must be a string' 
      });
    }
    
    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ 
        status: false,
        error: 'Name must be between 2 and 100 characters' 
    });
  }
  }

  // Validate sub_permissions if provided
  if (sub_permissions !== undefined && sub_permissions !== null) {
    if (!Array.isArray(sub_permissions)) {
      return res.status(400).json({
        status: false,
        error: 'sub_permissions must be an array'
      });
    }

    const validation = validateSubPermissions(sub_permissions);
    if (!validation.valid) {
      return res.status(400).json({
        status: false,
        error: validation.message
      });
    }
  }

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (sub_permissions !== undefined) updateData.sub_permissions = sub_permissions;

    const updatedPermission = await Permission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPermission) {
      return res.status(404).json({ 
        status: false,
        error: 'Permission not found' 
      });
    }

    res.json({
      status: true,
      message: 'Permission updated successfully',
      data: updatedPermission
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        status: false,
        error: 'Permission name already exists' 
      });
    }
    res.status(400).json({ 
      status: false,
      error: error.message 
    });
  }
};

/**
 * Delete a permission by ID
 */
const deletePermission = async (req, res) => {
  try {
    const deletedPermission = await Permission.findByIdAndDelete(req.params.id);
    
    if (!deletedPermission) {
      return res.status(404).json({ 
        status: false,
        error: 'Permission not found' 
      });
    }
    
    res.json({ 
      status: true,
      message: 'Permission deleted successfully',
      data: deletedPermission
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      error: error.message 
    });
  }
};

/**
 * Add a sub-permission to an existing permission
 * This allows adding nested permissions without replacing the entire structure
 */
const addSubPermission = async (req, res) => {
  const { id } = req.params;
  const { path, sub_permission } = req.body;

  if (!sub_permission || !sub_permission.name) {
    return res.status(400).json({
      status: false,
      error: 'sub_permission with name is required'
    });
  }

  try {
    const permission = await Permission.findById(id);
    
    if (!permission) {
      return res.status(404).json({
        status: false,
        error: 'Permission not found'
      });
    }

    // If path is provided, navigate to that level, otherwise add to root
    if (path && Array.isArray(path) && path.length > 0) {
      let current = permission.sub_permissions;
      
      for (let i = 0; i < path.length; i++) {
        const index = path[i];
        if (!current[index]) {
          return res.status(400).json({
            status: false,
            error: `Invalid path: index ${index} not found`
          });
        }
        
        if (i === path.length - 1) {
          // Last level - add here
          if (!current[index].sub_permissions) {
            current[index].sub_permissions = [];
          }
          current[index].sub_permissions.push(sub_permission);
        } else {
          current = current[index].sub_permissions;
        }
      }
    } else {
      // Add to root level
      permission.sub_permissions.push(sub_permission);
    }

    await permission.save();

    res.json({
      status: true,
      message: 'Sub-permission added successfully',
      data: permission
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message
    });
  }
};

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  addSubPermission
};

