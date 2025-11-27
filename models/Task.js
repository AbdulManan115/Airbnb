const mongoose = require('mongoose');

const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

const taskSchema = new mongoose.Schema(
  {
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 5
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'pending'
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

const Task = mongoose.model('Task', taskSchema);

Task.STATUSES = TASK_STATUSES;
Task.DEFAULT_STATUS = 'pending';

module.exports = Task;
