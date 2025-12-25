const mongoose = require('mongoose');

// Define sub-permission schema (for nested permissions)
const subPermissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sub_permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { _id: false });

// Main permission schema with recursive sub-permissions
const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    sub_permissions: {
      type: [subPermissionSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        // Keep _id for compatibility with the sample format
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Index for faster queries
permissionSchema.index({ name: 1 });

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;

