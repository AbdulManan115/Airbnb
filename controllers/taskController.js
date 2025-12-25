const Task = require('../models/Task');
const Property = require('../models/Property');
const User = require('../models/User');
const { getEffectiveHostId } = require('../middleware/multiTenantMiddleware');

const populateTaskQuery = (query) =>
  query
    .populate('hostId', 'name email')
    .populate('property_id', 'title location status')
    .populate('assigned_to', 'name email role');

const getTasks = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build base query
    const baseQuery = hostId ? { hostId } : {}; // Empty query for superadmin
    let query = Task.find(baseQuery);

    // Optional filters
    const { status, assigned_to, property_id } = req.query;
    if (status) {
      query = query.where('status').equals(status);
    }
    if (assigned_to) {
      query = query.where('assigned_to').equals(assigned_to);
    }
    if (property_id) {
      query = query.where('property_id').equals(property_id);
    }

    const tasks = await populateTaskQuery(query.sort({ createdAt: -1 }));
    res.json(await tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTask = async (req, res) => {
  const { property_id, title, description, assigned_to, status } = req.body;

  if (!property_id || !title || !description || !assigned_to) {
    return res.status(400).json({
      error: 'property_id, title, description, and assigned_to are required'
    });
  }

  if (title.length < 3) {
    return res.status(400).json({ error: 'Title must be at least 3 characters long' });
  }

  if (description.length < 5) {
    return res.status(400).json({ error: 'Description must be at least 5 characters long' });
  }

  if (status && !Task.STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${Task.STATUSES.join(', ')}`
    });
  }

  const hostId = getEffectiveHostId(req);
  
  try {
    const propertyQuery = hostId ? { _id: property_id, hostId } : { _id: property_id };
    const property = await Property.findOne(propertyQuery);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid property_id' });
  }

  try {
    // For team members, check if they belong to the same host
    const userQuery = hostId 
      ? { _id: assigned_to, $or: [{ _id: hostId }, { hostId: hostId }] } 
      : { _id: assigned_to };
    const user = await User.findOne(userQuery);
    if (!user) {
      return res.status(404).json({ error: 'Assigned user not found' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid assigned_to (user_id)' });
  }

  try {
    const task = new Task({
      hostId,
      property_id,
      title,
      description,
      assigned_to,
      status: status || Task.DEFAULT_STATUS
    });

    const newTask = await task.save();
    const populatedTask = await populateTaskQuery(Task.findById(newTask._id));

    res.status(201).json(await populatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  const { property_id, title, description, assigned_to, status } = req.body;

  if (status && !Task.STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${Task.STATUSES.join(', ')}`
    });
  }

  if (title && title.length < 3) {
    return res.status(400).json({ error: 'Title must be at least 3 characters long' });
  }

  if (description && description.length < 5) {
    return res.status(400).json({ error: 'Description must be at least 5 characters long' });
  }

  if (property_id) {
    try {
      const property = await Property.findById(property_id);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid property_id' });
    }
  }

  if (assigned_to) {
    try {
      const user = await User.findById(assigned_to);
      if (!user) {
        return res.status(404).json({ error: 'Assigned user not found' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid assigned_to (user_id)' });
    }
  }

  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can update any task
    
    const updateData = {};
    if (typeof property_id !== 'undefined') updateData.property_id = property_id;
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof description !== 'undefined') updateData.description = description;
    if (typeof assigned_to !== 'undefined') updateData.assigned_to = assigned_to;
    if (typeof status !== 'undefined') updateData.status = status;

    const updatedTask = await populateTaskQuery(
      Task.findOneAndUpdate(query, updateData, {
        new: true,
        runValidators: true,
        overwrite: false
      })
    );

    const result = await updatedTask;
    if (!result) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can delete any task
    
    const deletedTask = await Task.findOneAndDelete(query);
    
    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};
