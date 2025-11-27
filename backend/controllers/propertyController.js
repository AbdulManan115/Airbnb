const Property = require('../models/Property');

const getProperties = async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProperty = async (req, res) => {
  const { title, description, price, location, propertyType, bedrooms, bathrooms, area, status } = req.body;

  // Validate required fields
  if (!title || !description || !price || !location || !area) {
    return res.status(400).json({ 
      error: 'Title, description, price, location, and area are required' 
    });
  }

  // Validate price
  if (price < 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  // Validate area
  if (area < 0) {
    return res.status(400).json({ error: 'Area must be a positive number' });
  }

  // Validate property type
  if (propertyType && !Property.PROPERTY_TYPES.includes(propertyType)) {
    return res.status(400).json({ 
      error: `Invalid property type. Must be one of: ${Property.PROPERTY_TYPES.join(', ')}` 
    });
  }

  // Validate status
  if (status && !Property.STATUSES.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${Property.STATUSES.join(', ')}` 
    });
  }

  try {
    const propertyData = {
      title,
      description,
      price,
      location,
      area,
      propertyType: propertyType || Property.DEFAULT_PROPERTY_TYPE,
      status: status || Property.DEFAULT_STATUS,
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 0
    };

    const property = new Property(propertyData);
    const newProperty = await property.save();

    res.status(201).json(newProperty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateProperty = async (req, res) => {
  const { title, description, price, location, propertyType, bedrooms, bathrooms, area, status } = req.body;

  // Validate property type if provided
  if (propertyType && !Property.PROPERTY_TYPES.includes(propertyType)) {
    return res.status(400).json({ 
      error: `Invalid property type. Must be one of: ${Property.PROPERTY_TYPES.join(', ')}` 
    });
  }

  // Validate status if provided
  if (status && !Property.STATUSES.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${Property.STATUSES.join(', ')}` 
    });
  }

  // Validate price if provided
  if (price !== undefined && price < 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  // Validate area if provided
  if (area !== undefined && area < 0) {
    return res.status(400).json({ error: 'Area must be a positive number' });
  }

  try {
    const updateData = {};
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof description !== 'undefined') updateData.description = description;
    if (typeof price !== 'undefined') updateData.price = price;
    if (typeof location !== 'undefined') updateData.location = location;
    if (typeof propertyType !== 'undefined') updateData.propertyType = propertyType;
    if (typeof bedrooms !== 'undefined') updateData.bedrooms = bedrooms;
    if (typeof bathrooms !== 'undefined') updateData.bathrooms = bathrooms;
    if (typeof area !== 'undefined') updateData.area = area;
    if (typeof status !== 'undefined') updateData.status = status;

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, overwrite: false }
    );

    if (!updatedProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(updatedProperty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const deletedProperty = await Property.findByIdAndDelete(req.params.id);
    if (!deletedProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
};

