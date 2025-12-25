const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
} = require('../controllers/propertyController');

// All property routes require authentication
router.use(protect);

// Get all properties
router.get('/', getProperties);

// Create new property
router.post('/', createProperty);

// Get property by ID
router.get('/:id', getPropertyById);

// Update property
router.put('/:id', updateProperty);

// Delete property
router.delete('/:id', deleteProperty);

module.exports = router;

