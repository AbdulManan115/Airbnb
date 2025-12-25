const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    idCard: {
      type: String,
      default: null
    },
    profilePicture: {
      type: String,
      default: null
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

// Create compound index for email uniqueness per host (sparse allows multiple null emails)
guestSchema.index({ email: 1, hostId: 1 }, { unique: true, sparse: true });

const Guest = mongoose.model('Guest', guestSchema);

module.exports = Guest;
