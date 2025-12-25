const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      default: null,
      validate: {
        validator: function(v) {
          // Allow null or empty, or validate phone format
          if (!v) return true;
          // Basic phone validation: allows +, -, (), spaces, and digits
          return /^[\d\s\-\+\(\)]+$/.test(v);
        },
        message: 'Please enter a valid phone number'
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false // Don't return password by default
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role', // Reference to Role model
      required: false,
      default: null
    },
    host: {
      type: Boolean,
      default: false
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      // Only team members have a hostId; hosts and superadmin don't
    },
    permissions: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
      }],
      default: []
    },
    // Additional fields for hosts
    businessName: {
      type: String,
      required: false,
      default: null,
      trim: true
    },
    // Additional fields for staff (both host staff and superadmin staff)
    department: {
      type: String,
      required: false,
      default: null,
      trim: true
    },
    accessLevel: {
      type: String,
      required: false,
      default: null,
      enum: [null, 'full', 'limited', 'read-only']
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Helper method to get role type
userSchema.methods.getRoleType = function() {
  if (typeof this.role === 'string') {
    return 'string'; // superadmin or legacy role
  }
  return 'objectid'; // Role reference
};

const User = mongoose.model('User', userSchema);

module.exports = User;

