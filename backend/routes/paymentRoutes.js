const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
} = require('../controllers/paymentController');

// Get all payments
router.get('/', getPayments);

// Create new payment
router.post('/', createPayment);

// Get payment by ID
router.get('/:id', getPaymentById);

// Update payment
router.put('/:id', updatePayment);

// Delete payment
router.delete('/:id', deletePayment);

module.exports = router;

