const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Guest = require('../models/Guest');
const { getEffectiveHostId } = require('../middleware/multiTenantMiddleware');

const getBookings = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build base query
    const query = hostId ? { hostId } : {}; // Empty query for superadmin
    
    // Add date filtering if provided (for analytics)
    const { startDate, endDate, period } = req.query;
    
    if (period) {
      // Calculate date range based on period
      const now = new Date();
      let start = new Date();
      
      switch(period) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case '15days':
          start.setDate(now.getDate() - 15);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        case '6months':
          start.setMonth(now.getMonth() - 6);
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      query.start_date = { $gte: start };
    } else if (startDate || endDate) {
      // Custom date range
      if (startDate && endDate) {
        query.start_date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      } else if (startDate) {
        query.start_date = { $gte: new Date(startDate) };
      } else if (endDate) {
        query.start_date = { $lte: new Date(endDate) };
      }
    }
    
    const bookings = await Booking.find(query)
      .populate('hostId', 'name email')
      .populate('property_id', 'title location price')
      .populate('guest_id', 'name phone email')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can see any booking
    
    const booking = await Booking.findOne(query)
      .populate('hostId', 'name email')
      .populate('property_id', 'title location price')
      .populate('guest_id', 'name phone email');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createBooking = async (req, res) => {
  const { property_id, guest_id, start_date, end_date, amount } = req.body;

  // Validate required fields
  if (!property_id || !guest_id || !start_date || !end_date || amount === undefined) {
    return res.status(400).json({ 
      error: 'property_id, guest_id, start_date, end_date, and amount are required' 
    });
  }

  // Validate amount
  if (amount < 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // Validate dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (isNaN(startDate.getTime())) {
    return res.status(400).json({ error: 'Invalid start_date format' });
  }

  if (isNaN(endDate.getTime())) {
    return res.status(400).json({ error: 'Invalid end_date format' });
  }

  if (endDate <= startDate) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }

  // Validate that property exists and belongs to this host
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

  // Validate that guest exists and belongs to this host
  try {
    const guestQuery = hostId ? { _id: guest_id, hostId } : { _id: guest_id };
    const guest = await Guest.findOne(guestQuery);
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid guest_id' });
  }

  try {
    const bookingData = {
      hostId,
      property_id,
      guest_id,
      start_date: startDate,
      end_date: endDate,
      amount
    };

    const booking = new Booking(bookingData);
    const newBooking = await booking.save();
    
    // Populate the booking before returning
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('hostId', 'name email')
      .populate('property_id', 'title location price')
      .populate('guest_id', 'name phone email');

    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateBooking = async (req, res) => {
  const { property_id, guest_id, start_date, end_date, amount } = req.body;

  // Validate amount if provided
  if (amount !== undefined && amount < 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // Validate dates if provided
  let startDate, endDate;
  if (start_date) {
    startDate = new Date(start_date);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Invalid start_date format' });
    }
  }

  if (end_date) {
    endDate = new Date(end_date);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid end_date format' });
    }
  }

  // If both dates are provided, validate end_date > start_date
  if (startDate && endDate && endDate <= startDate) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }

  // Validate property_id if provided
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

  // Validate guest_id if provided
  if (guest_id) {
    try {
      const guest = await Guest.findById(guest_id);
      if (!guest) {
        return res.status(404).json({ error: 'Guest not found' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid guest_id' });
    }
  }

  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can update any booking
    
    // Get existing booking to validate date constraints
    const existingBooking = await Booking.findOne(query);
    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // If only one date is being updated, use existing date for validation
    const finalStartDate = startDate || existingBooking.start_date;
    const finalEndDate = endDate || existingBooking.end_date;

    if (finalEndDate <= finalStartDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const updateData = {};
    if (typeof property_id !== 'undefined') updateData.property_id = property_id;
    if (typeof guest_id !== 'undefined') updateData.guest_id = guest_id;
    if (typeof start_date !== 'undefined') updateData.start_date = startDate;
    if (typeof end_date !== 'undefined') updateData.end_date = endDate;
    if (typeof amount !== 'undefined') updateData.amount = amount;

    const updatedBooking = await Booking.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true, overwrite: false }
    )
      .populate('hostId', 'name email')
      .populate('property_id', 'title location price')
      .populate('guest_id', 'name phone email');

    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can delete any booking
    
    const deletedBooking = await Booking.findOneAndDelete(query);
    
    if (!deletedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
};

