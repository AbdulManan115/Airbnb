const Guest = require('../models/Guest');

const getGuests = async (req, res) => {
  try {
    const guests = await Guest.find().sort({ createdAt: -1 });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGuestById = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.json(guest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createGuest = async (req, res) => {
  const { name, phone, email } = req.body;

  // Validate required fields
  if (!name || !phone || !email) {
    return res.status(400).json({ 
      error: 'Name, phone, and email are required' 
    });
  }

  // Validate email format
  const emailRegex = /.+@.+\..+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Please enter a valid email address' 
    });
  }

  try {
    const guestData = {
      name,
      phone,
      email
    };

    const guest = new Guest(guestData);
    const newGuest = await guest.save();

    res.status(201).json(newGuest);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: error.message });
  }
};

const updateGuest = async (req, res) => {
  const { name, phone, email } = req.body;

  // Validate email format if provided
  if (email) {
    const emailRegex = /.+@.+\..+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please enter a valid email address' 
      });
    }
  }

  try {
    const updateData = {};
    if (typeof name !== 'undefined') updateData.name = name;
    if (typeof phone !== 'undefined') updateData.phone = phone;
    if (typeof email !== 'undefined') updateData.email = email;

    const updatedGuest = await Guest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, overwrite: false }
    );

    if (!updatedGuest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json(updatedGuest);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: error.message });
  }
};

const deleteGuest = async (req, res) => {
  try {
    const deletedGuest = await Guest.findByIdAndDelete(req.params.id);
    if (!deletedGuest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest
};

