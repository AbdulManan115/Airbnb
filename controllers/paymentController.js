const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { getEffectiveHostId } = require('../middleware/multiTenantMiddleware');

const getPayments = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId ? { hostId } : {}; // Empty query for superadmin
    
    const payments = await Payment.find(query)
      .populate('hostId', 'name email')
      .populate('booking_id', 'start_date end_date amount')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can see any payment
    
    const payment = await Payment.findOne(query)
      .populate('hostId', 'name email')
      .populate('booking_id', 'start_date end_date amount');
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPayment = async (req, res) => {
  const { booking_id, amount, date } = req.body;

  // Validate required fields
  if (!booking_id || amount === undefined) {
    return res.status(400).json({ 
      error: 'booking_id and amount are required' 
    });
  }

  // Validate amount
  if (amount < 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // Validate date if provided
  let paymentDate;
  if (date) {
    paymentDate = new Date(date);
    if (isNaN(paymentDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
  } else {
    paymentDate = new Date(); // Default to current date
  }

  // Validate that booking exists and belongs to this host
  const hostId = getEffectiveHostId(req);
  
  try {
    const bookingQuery = hostId ? { _id: booking_id, hostId } : { _id: booking_id };
    const booking = await Booking.findOne(bookingQuery);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid booking_id' });
  }

  try {
    const paymentData = {
      hostId,
      booking_id,
      amount,
      date: paymentDate
    };

    const payment = new Payment(paymentData);
    const newPayment = await payment.save();
    
    // Populate the payment before returning
    const populatedPayment = await Payment.findById(newPayment._id)
      .populate('hostId', 'name email')
      .populate('booking_id', 'start_date end_date amount');

    res.status(201).json(populatedPayment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updatePayment = async (req, res) => {
  const { booking_id, amount, date } = req.body;

  // Validate amount if provided
  if (amount !== undefined && amount < 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // Validate date if provided
  let paymentDate;
  if (date) {
    paymentDate = new Date(date);
    if (isNaN(paymentDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
  }

  // Validate booking_id if provided
  if (booking_id) {
    try {
      const booking = await Booking.findById(booking_id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid booking_id' });
    }
  }

  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can update any payment
    
    const updateData = {};
    if (typeof booking_id !== 'undefined') updateData.booking_id = booking_id;
    if (typeof amount !== 'undefined') updateData.amount = amount;
    if (typeof date !== 'undefined') updateData.date = paymentDate;

    const updatedPayment = await Payment.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true, overwrite: false }
    )
      .populate('hostId', 'name email')
      .populate('booking_id', 'start_date end_date amount');

    if (!updatedPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(updatedPayment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const hostId = getEffectiveHostId(req);
    
    // Build query based on user role
    const query = hostId 
      ? { _id: req.params.id, hostId } 
      : { _id: req.params.id }; // Superadmin can delete any payment
    
    const deletedPayment = await Payment.findOneAndDelete(query);
    
    if (!deletedPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
};

