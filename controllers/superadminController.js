const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Guest = require('../models/Guest');
const Payment = require('../models/Payment');
const Task = require('../models/Task');

// Get all hosts
const getAllHosts = async (req, res) => {
  try {
    const hosts = await User.find({ host: true, hostId: null })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: hosts.length,
      hosts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a specific host's details
const getHostDetails = async (req, res) => {
  try {
    const { hostId } = req.params;

    const host = await User.findOne({ _id: hostId, host: true, hostId: null })
      .select('-password');

    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    // Get counts of host's resources
    const [propertiesCount, bookingsCount, usersCount, guestsCount, tasksCount, paymentsCount] = await Promise.all([
      Property.countDocuments({ hostId }),
      Booking.countDocuments({ hostId }),
      User.countDocuments({ hostId }),
      Guest.countDocuments({ hostId }),
      Task.countDocuments({ hostId }),
      Payment.countDocuments({ hostId })
    ]);

    res.json({
      success: true,
      host,
      statistics: {
        properties: propertiesCount,
        bookings: bookingsCount,
        users: usersCount,
        guests: guestsCount,
        tasks: tasksCount,
        payments: paymentsCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users for a specific host
const getHostUsers = async (req, res) => {
  try {
    const { hostId } = req.params;

    // Verify host exists
    const host = await User.findOne({ _id: hostId, host: true, hostId: null });
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    const users = await User.find({ hostId })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      hostId,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all properties for a specific host
const getHostProperties = async (req, res) => {
  try {
    const { hostId } = req.params;

    // Verify host exists
    const host = await User.findOne({ _id: hostId, host: true, hostId: null });
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    const properties = await Property.find({ hostId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      hostId,
      count: properties.length,
      properties
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all bookings for a specific host
const getHostBookings = async (req, res) => {
  try {
    const { hostId } = req.params;

    // Verify host exists
    const host = await User.findOne({ _id: hostId, host: true, hostId: null });
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    const bookings = await Booking.find({ hostId })
      .populate('property_id', 'title location')
      .populate('guest_id', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      hostId,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all guests for a specific host
const getHostGuests = async (req, res) => {
  try {
    const { hostId } = req.params;

    // Verify host exists
    const host = await User.findOne({ _id: hostId, host: true, hostId: null });
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    const guests = await Guest.find({ hostId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      hostId,
      count: guests.length,
      guests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all tasks for a specific host
const getHostTasks = async (req, res) => {
  try {
    const { hostId } = req.params;

    // Verify host exists
    const host = await User.findOne({ _id: hostId, host: true, hostId: null });
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    const tasks = await Task.find({ hostId })
      .populate('property_id', 'title location')
      .populate('assigned_to', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      hostId,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all payments for a specific host
const getHostPayments = async (req, res) => {
  try {
    const { hostId } = req.params;

    // Verify host exists
    const host = await User.findOne({ _id: hostId, host: true, hostId: null });
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    const payments = await Payment.find({ hostId })
      .populate('booking_id')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      hostId,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get system-wide statistics
const getSystemStatistics = async (req, res) => {
  try {
    const [
      totalHosts,
      totalUsers,
      totalProperties,
      totalBookings,
      totalGuests,
      totalTasks,
      totalPayments
    ] = await Promise.all([
      User.countDocuments({ host: true, hostId: null }),
      User.countDocuments({ $or: [{ host: false }, { hostId: { $ne: null } }] }),
      Property.countDocuments(),
      Booking.countDocuments(),
      Guest.countDocuments(),
      Task.countDocuments(),
      Payment.countDocuments()
    ]);

    res.json({
      success: true,
      statistics: {
        hosts: totalHosts,
        users: totalUsers,
        properties: totalProperties,
        bookings: totalBookings,
        guests: totalGuests,
        tasks: totalTasks,
        payments: totalPayments
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllHosts,
  getHostDetails,
  getHostUsers,
  getHostProperties,
  getHostBookings,
  getHostGuests,
  getHostTasks,
  getHostPayments,
  getSystemStatistics
};

