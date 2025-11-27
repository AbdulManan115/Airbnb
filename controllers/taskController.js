const Task = require('../models/Task');
const Property = require('../models/Property');
const User = require('../models/User');

const populateTaskQuery = (query) =>
  query
    .populate('property_id', 'title location status')
    .populate('assigned_to', 'name email role');

const getTasks = async (req, res) => {
  try {
    let query = Task.find();

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

  try {
    const property = await Property.findById(property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid property_id' });
  }

  try {
    const user = await User.findById(assigned_to);
    if (!user) {
      return res.status(404).json({ error: 'Assigned user not found' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid assigned_to (user_id)' });
  }

  try {
    const task = new Task({
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
    const updateData = {};
    if (typeof property_id !== 'undefined') updateData.property_id = property_id;
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof description !== 'undefined') updateData.description = description;
    if (typeof assigned_to !== 'undefined') updateData.assigned_to = assigned_to;
    if (typeof status !== 'undefined') updateData.status = status;

    const updatedTask = await populateTaskQuery(
      Task.findByIdAndUpdate(req.params.id, updateData, {
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
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
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
