const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['IMPERSONATION_START', 'IMPERSONATION_END', 'IMPERSONATION_ACTION'],
      index: true
    },
    superadminId: {
      type: String, // Can be 'superadmin' string or ObjectId
      required: true,
      index: true
    },
    superadminEmail: {
      type: String,
      required: true
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetUserEmail: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    endpoint: {
      type: String,
      default: null
    },
    method: {
      type: String,
      default: null
    },
    duration: {
      type: Number, // Duration in milliseconds (for END actions)
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false // We're using timestamp field instead
  }
);

// Index for efficient querying
auditLogSchema.index({ superadminId: 1, timestamp: -1 });
auditLogSchema.index({ targetUserId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index to auto-delete logs older than 90 days (optional)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;

