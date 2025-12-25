const Guest = require('../models/Guest');
const Booking = require('../models/Booking');
const { getEffectiveHostId } = require('../middleware/multiTenantMiddleware');
const { deleteFile } = require('../middleware/uploadMiddleware');
const path = require('path');

const getGuests = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId ? { hostId } : {}; // Empty query for superadmin
    
    const guests = await Guest.find(query)
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(guests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGuestById = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can see any guest
    
    const guest = await Guest.findOne(query).populate('hostId', 'name email');
    
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
    const hostId = getEffectiveHostId(req);
    
    const guestData = {
      hostId,
      name,
      phone,
      email
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.idCard) {
        guestData.idCard = `/uploads/guests/${req.files.idCard[0].filename}`;
      }
      if (req.files.profilePicture) {
        guestData.profilePicture = `/uploads/guests/${req.files.profilePicture[0].filename}`;
      }
    }

    const guest = new Guest(guestData);
    const newGuest = await guest.save();

    res.status(201).json(newGuest);
  } catch (error) {
    // Clean up uploaded files if guest creation fails
    if (req.files) {
      if (req.files.idCard) {
        deleteFile(path.join(__dirname, '../uploads/guests', req.files.idCard[0].filename));
      }
      if (req.files.profilePicture) {
        deleteFile(path.join(__dirname, '../uploads/guests', req.files.profilePicture[0].filename));
      }
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists for this host' });
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
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can update any guest
    
    // Get existing guest to handle old file deletion
    const existingGuest = await Guest.findOne(query);
    if (!existingGuest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    const updateData = {};
    if (typeof name !== 'undefined') updateData.name = name;
    if (typeof phone !== 'undefined') updateData.phone = phone;
    if (typeof email !== 'undefined') updateData.email = email;

    // Handle file uploads
    if (req.files) {
      if (req.files.idCard) {
        // Delete old ID card if exists
        if (existingGuest.idCard) {
          deleteFile(path.join(__dirname, '..', existingGuest.idCard));
        }
        updateData.idCard = `/uploads/guests/${req.files.idCard[0].filename}`;
      }
      if (req.files.profilePicture) {
        // Delete old profile picture if exists
        if (existingGuest.profilePicture) {
          deleteFile(path.join(__dirname, '..', existingGuest.profilePicture));
        }
        updateData.profilePicture = `/uploads/guests/${req.files.profilePicture[0].filename}`;
      }
    }

    const updatedGuest = await Guest.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true, overwrite: false }
    ).populate('hostId', 'name email');

    res.json(updatedGuest);
  } catch (error) {
    // Clean up uploaded files if update fails
    if (req.files) {
      if (req.files.idCard) {
        deleteFile(path.join(__dirname, '../uploads/guests', req.files.idCard[0].filename));
      }
      if (req.files.profilePicture) {
        deleteFile(path.join(__dirname, '../uploads/guests', req.files.profilePicture[0].filename));
      }
    }

    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: error.message });
  }
};

const deleteGuest = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can delete any guest
    
    const deletedGuest = await Guest.findOneAndDelete(query);
    
    if (!deletedGuest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    // Delete associated files
    if (deletedGuest.idCard) {
      deleteFile(path.join(__dirname, '..', deletedGuest.idCard));
    }
    if (deletedGuest.profilePicture) {
      deleteFile(path.join(__dirname, '..', deletedGuest.profilePicture));
    }
    
    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get guest booking history
const getGuestBookings = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query to verify guest belongs to host
    const guestQuery = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can see any guest
    
    const guest = await Guest.findOne(guestQuery).populate('hostId', 'name email');
    
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    // Get all bookings for this guest
    const bookings = await Booking.find({ guest_id: req.params.id })
      .populate('property_id', 'title location price')
      .populate('hostId', 'name email')
      .sort({ start_date: -1 });

    // Calculate statistics
    const now = new Date();
    const upcomingBookings = bookings.filter(b => new Date(b.start_date) > now);
    const pastBookings = bookings.filter(b => new Date(b.end_date) < now);
    const currentBookings = bookings.filter(b => 
      new Date(b.start_date) <= now && new Date(b.end_date) >= now
    );

    const totalSpent = bookings.reduce((sum, booking) => sum + booking.amount, 0);
    const totalNights = bookings.reduce((sum, booking) => {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return sum + nights;
    }, 0);

    const averageStayDuration = bookings.length > 0 ? totalNights / bookings.length : 0;

    res.json({
      guest,
      bookings,
      statistics: {
        totalBookings: bookings.length,
        upcomingBookings: upcomingBookings.length,
        pastBookings: pastBookings.length,
        currentBookings: currentBookings.length,
        totalSpent,
        totalNights,
        averageStayDuration: Math.round(averageStayDuration * 10) / 10,
        lastBookingDate: bookings.length > 0 ? bookings[0].start_date : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  getGuestBookings
};

