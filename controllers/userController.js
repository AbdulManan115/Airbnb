const User = require('../models/User');

const getRoles = async (req, res) => {
  try {
    res.json({
      roles: User.ROLES,
      defaultRole: User.DEFAULT_ROLE
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('permissions', 'name description roles')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('permissions', 'name description roles');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  const { name, email, password, role, permissions } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Password must be at least 6 characters
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  if (role && !User.ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${User.ROLES.join(', ')}` });
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
      password,
      role: role || User.DEFAULT_ROLE,
      permissions: permissions || []
    };

    const user = new User(userData);
    const newUser = await user.save();
    
    // Populate permissions before returning
    await newUser.populate('permissions', 'name description roles');
    
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
  const { name, email, role, permissions } = req.body;

  if (role && !User.ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${User.ROLES.join(', ')}` });
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
    const updateData = {};
    if (typeof name !== 'undefined') updateData.name = name;
    if (typeof email !== 'undefined') updateData.email = email;
    if (typeof role !== 'undefined') updateData.role = role;
    if (typeof permissions !== 'undefined') updateData.permissions = permissions;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, overwrite: false }
    )
      .populate('permissions', 'name description roles');

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
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
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
  deleteUser
};

