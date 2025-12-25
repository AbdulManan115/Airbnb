const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    propertyType: {
      type: String,
      required: true,
      enum: ['house', 'apartment', 'villa', 'land', 'commercial'],
      default: 'house'
    },
    bedrooms: {
      type: Number,
      min: 0,
      default: 0
    },
    bathrooms: {
      type: Number,
      min: 0,
      default: 0
    },
    area: {
      type: Number,
      min: 0,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'rented'],
      default: 'available'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

const Property = mongoose.model('Property', propertySchema);

Property.PROPERTY_TYPES = ['house', 'apartment', 'villa', 'land', 'commercial'];
Property.STATUSES = ['available', 'sold', 'rented'];
Property.DEFAULT_PROPERTY_TYPE = 'house';
Property.DEFAULT_STATUS = 'available';

module.exports = Property;

